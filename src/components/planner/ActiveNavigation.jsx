import { useCallback, useEffect, useRef, useState } from "react";
import { useJourney } from "../../context/JourneyContext";
import { useDeviceHeading } from "../../hooks/useDeviceHeading";
import { useImpact } from "../../hooks/useImpact";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { useTheme } from "../../hooks/useTheme";
import { useTurnByTurn } from "../../hooks/useTurnByTurn";
import { useWakeLock } from "../../hooks/useWakeLock";
import { getLocations } from "../../lib/api";
import { formatDistance, MODE_META } from "../../lib/format";
import { describeStep } from "../../lib/navigation";
import { speak, speechSupported, stopSpeaking } from "../../lib/speech";
import NavigationPanel, { MANEUVER_ICON } from "./NavigationPanel";
import PlannerMap from "./PlannerMap";
import "./Planner.css";

/** Mounted once in App: the journey keeps going whichever page is open, until the user ends it or arrives. */
export default function ActiveNavigation() {
  const journey = useJourney();
  if (!journey?.trip) return null;
  return <ActiveTrip key={journey.trip.id} {...journey} />;
}

function ActiveTrip({ trip, updateTrip, endTrip }) {
  const { option, destination, origin, minimised } = trip;
  const { resolved: theme } = useTheme();
  const { stats, recordJourney } = useImpact();
  const compass = useDeviceHeading();
  const [gpsOn, setGpsOn] = useState(true);
  const live = useLiveLocation(gpsOn);
  const [voiceOn, setVoiceOn] = useState(() => speechSupported() && trip.voiceOn !== false);
  const [following, setFollowing] = useState(true);
  const [cycleParks, setCycleParks] = useState([]);
  const recorded = useRef(trip.arrived);

  const gpsHeading = live.position?.speed > 0.7 && Number.isFinite(live.position?.heading) ? live.position.heading : null;
  const heading = compass.heading ?? gpsHeading;

  const onReroute = useCallback((next) => updateTrip({ option: next }), [updateTrip]);
  const onArrive = useCallback(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordJourney(option); // CO₂ and streak counted once, on arrival
    updateTrip({ arrived: true, minimised: false });
  }, [option, recordJourney, updateTrip]);

  const nav = useTurnByTurn({ option, destination, position: live.position, voiceOn, onReroute, onArrive });
  useWakeLock(!nav.arrived);

  useEffect(() => stopSpeaking, []);

  useEffect(() => {
    getLocations()
      .then((locs) => setCycleParks(locs.filter((l) => l.type === "cycle_park")))
      .catch(() => {});
  }, []);

  // Full-screen directions: stop the page behind from scrolling. Minimised: leave room for the bar.
  useEffect(() => {
    const cls = minimised ? "has-nav-bar" : "nav-open";
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, [minimised]);

  // Escape minimises (it never ends the journey)
  useEffect(() => {
    if (minimised) return undefined;
    const onKey = (e) => e.key === "Escape" && updateTrip({ minimised: true });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [minimised, updateTrip]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    updateTrip({ voiceOn: next });
    if (next) speak(describeStep(nav.step));
    else stopSpeaking();
  };

  const exit = () => {
    stopSpeaking();
    endTrip();
  };

  const retryLocation = () => {
    setGpsOn(false);
    setTimeout(() => setGpsOn(true), 50);
  };

  const meta = MODE_META[option.mode];
  const step = nav.step;

  if (minimised) {
    return (
      <div className="nav-bar" role="region" aria-label="Journey in progress">
        <button type="button" className="nav-bar-main" onClick={() => updateTrip({ minimised: false })}>
          <span className="nav-bar-icon" style={{ background: meta.color }} aria-hidden="true">
            {step?.transit ? meta.icon : MANEUVER_ICON[step?.maneuver] || meta.icon}
          </span>
          <span className="nav-bar-text">
            <strong>{step ? describeStep(step) : `${option.label} to ${destination.label}`}</strong>
            <span>
              {nav.distanceToStepEnd != null && !step?.transit ? `${formatDistance(nav.distanceToStepEnd)} · ` : ""}
              {option.label} to {destination.label}
            </span>
          </span>
        </button>
        <button type="button" className="btn btn-primary nav-bar-open" onClick={() => updateTrip({ minimised: false })}>
          Open
        </button>
        <button type="button" className="nav-icon-btn" onClick={exit} aria-label="End navigation" title="End journey">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="nav-overlay" role="dialog" aria-modal="true" aria-label={`Directions to ${destination.label}`}>
      <div className="nav-overlay-map">
        <PlannerMap
          mapKey={`nav-${trip.id}`}
          origin={origin}
          destination={destination}
          option={option}
          userPosition={live.position}
          heading={heading}
          compass={compass}
          navigating
          following={following}
          onUserPan={() => setFollowing(false)}
          cycleParks={cycleParks}
          theme={theme}
        />
        {!following && (
          <button type="button" className="btn btn-primary recenter-btn" onClick={() => setFollowing(true)}>
            ◎ Re-centre
          </button>
        )}
      </div>
      <NavigationPanel
        option={option}
        destination={destination}
        position={live.position}
        locationError={live.error}
        onRetryLocation={retryLocation}
        nav={nav}
        voiceOn={voiceOn}
        onToggleVoice={toggleVoice}
        onMinimise={() => updateTrip({ minimised: true })}
        onExit={exit}
        impact={stats}
      />
    </div>
  );
}
