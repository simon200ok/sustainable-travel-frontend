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
  const [pannedAt, setPannedAt] = useState(0);
  const [cycleParks, setCycleParks] = useState([]);
  const recorded = useRef(trip.arrived);

  const gpsHeading = live.position?.speed > 0.7 && Number.isFinite(live.position?.heading) ? live.position.heading : null;
  const heading = compass.heading ?? gpsHeading;

  // A new route continues the same journey (same trip, CO₂ counted once at the end)
  const onReroute = useCallback((next) => updateTrip({ option: next, stepIndex: 0 }), [updateTrip]);
  const onIndexChange = useCallback((stepIndex) => updateTrip({ stepIndex }), [updateTrip]);
  const onArrive = useCallback(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordJourney(option); // CO₂ and streak counted once, on arrival
    updateTrip({ arrived: true, minimised: false });
  }, [option, recordJourney, updateTrip]);

  const nav = useTurnByTurn({
    option,
    destination,
    position: live.position,
    voiceOn,
    onReroute,
    onArrive,
    initialIndex: trip.stepIndex ?? 0,
    onIndexChange,
  });
  useWakeLock(!nav.arrived);

  useEffect(() => stopSpeaking, []);

  // After you move the map by hand, it goes back to following you after a few seconds (like Google Maps)
  useEffect(() => {
    if (following) return undefined;
    const timer = setTimeout(() => setFollowing(true), 8000);
    return () => clearTimeout(timer);
  }, [following, pannedAt]);

  // Coming back to the app (or to the directions) always shows where you are
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && setFollowing(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

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

  // The phone's Back gesture/button (and Escape) closes the directions to the bar at the bottom
  // instead of leaving the page. The journey keeps going either way.
  const ownsHistoryEntry = useRef(false);
  useEffect(() => {
    if (minimised) return undefined;
    window.history.pushState({ ...window.history.state, uosDirections: true }, "");
    ownsHistoryEntry.current = true;
    const onPop = () => {
      ownsHistoryEntry.current = false;
      updateTrip({ minimised: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [minimised, updateTrip]);

  const minimise = useCallback(() => {
    if (ownsHistoryEntry.current) window.history.back(); // the popstate above then minimises
    else updateTrip({ minimised: true });
  }, [updateTrip]);

  useEffect(() => {
    if (minimised) return undefined;
    const onKey = (e) => e.key === "Escape" && minimise();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [minimised, minimise]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    updateTrip({ voiceOn: next });
    if (next) speak(describeStep(nav.step));
    else stopSpeaking();
  };

  const exit = () => {
    stopSpeaking();
    if (ownsHistoryEntry.current) {
      ownsHistoryEntry.current = false;
      window.history.back(); // drop the entry added for the directions screen
    }
    endTrip();
  };

  const retryLocation = () => {
    setGpsOn(false);
    setTimeout(() => setGpsOn(true), 50);
  };

  const meta = MODE_META[option.mode];
  const step = nav.step;
  const open = () => {
    setFollowing(true);
    updateTrip({ minimised: false });
  };

  if (minimised) {
    return (
      <div className="nav-bar" role="region" aria-label="Journey in progress">
        <button type="button" className="nav-bar-main" onClick={open}>
          <span className="nav-bar-icon" style={{ background: meta.color }} aria-hidden="true">
            {step?.transit ? meta.icon : MANEUVER_ICON[step?.maneuver] || meta.icon}
          </span>
          <span className="nav-bar-text">
            <strong>{step ? describeStep(step) : `${option.label} to ${destination.label}`}</strong>
            <span>
              {nav.alightAlert ? `${nav.alightAlert} · ` : nav.distanceToStepEnd != null && !step?.transit ? `${formatDistance(nav.distanceToStepEnd)} · ` : ""}
              {option.label} to {destination.label}
            </span>
          </span>
        </button>
        <button type="button" className="btn btn-primary nav-bar-open" onClick={open}>
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
        <button
          type="button"
          className="nav-back-btn"
          onClick={minimise}
          aria-label="Back to the app. Your journey keeps going"
          title="Back to the app — your journey keeps going"
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <PlannerMap
          mapKey={`nav-${trip.id}`}
          ridingLine={nav.step?.transit?.line || null}
          origin={origin}
          destination={destination}
          option={option}
          userPosition={live.position}
          heading={heading}
          compass={compass}
          navigating
          following={following}
          onUserPan={() => {
            setFollowing(false);
            setPannedAt(Date.now());
          }}
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
        onExit={exit}
        impact={stats}
      />
    </div>
  );
}
