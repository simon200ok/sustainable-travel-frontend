import { useEffect, useRef, useState } from "react";
import { useTurnByTurn } from "../../hooks/useTurnByTurn";
import { formatDistance, formatKg, formatTime, MODE_META } from "../../lib/format";
import { describeStep } from "../../lib/navigation";
import { speak, speechSupported, stopSpeaking } from "../../lib/speech";
import LocationNotice from "../LocationNotice";

const MANEUVER_ICON = {
  TURN_LEFT: "⬅️",
  TURN_SLIGHT_LEFT: "↖️",
  TURN_SHARP_LEFT: "⬅️",
  TURN_RIGHT: "➡️",
  TURN_SLIGHT_RIGHT: "↗️",
  TURN_SHARP_RIGHT: "➡️",
  UTURN_LEFT: "↩️",
  UTURN_RIGHT: "↪️",
  ROUNDABOUT_LEFT: "🔄",
  ROUNDABOUT_RIGHT: "🔄",
  STRAIGHT: "⬆️",
  DEPART: "⬆️",
};

function useWakeLock(active) {
  const lock = useRef(null);
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return undefined;
    const request = async () => {
      try {
        lock.current = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed (e.g. battery saver); navigation still works
      }
    };
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock.current?.release().catch(() => {});
    };
  }, [active]);
}

export default function NavigationPanel({ option, destination, position, locationError, onRetryLocation, onReroute, onArrive, onExit, impact }) {
  const [voiceOn, setVoiceOn] = useState(speechSupported());
  const [showAll, setShowAll] = useState(false);
  const nav = useTurnByTurn({ option, destination, position, voiceOn, onReroute, onArrive });
  useWakeLock(!nav.arrived);

  useEffect(() => stopSpeaking, []);

  const meta = MODE_META[option.mode];
  const step = nav.step;

  if (nav.arrived) {
    return (
      <div className="nav-panel nav-arrived" role="status">
        <div className="nav-arrived-emoji" aria-hidden="true">🎉</div>
        <h3>You've arrived at {destination.label}</h3>
        {option.co2SavedKg > 0 ? (
          <p>
            Travelling by {option.label.toLowerCase()} saved <strong>{formatKg(option.co2SavedKg)} CO₂</strong> compared with driving alone.
          </p>
        ) : (
          <p>Thanks for sharing the car — fewer cars means cleaner air for Sunderland.</p>
        )}
        {impact && (
          <p className="nav-arrived-stats">
            This term: <strong>{formatKg(impact.termKg)}</strong> saved · 🔥 Streak: <strong>{impact.streak} day{impact.streak === 1 ? "" : "s"}</strong>
          </p>
        )}
        <button type="button" className="btn btn-primary" onClick={onExit}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="nav-panel" aria-live="polite">
      <div className="nav-header">
        <span className="route-option-icon" style={{ background: meta.color }} aria-hidden="true">{meta.icon}</span>
        <div className="nav-header-text">
          <strong>{option.label} to {destination.label}</strong>
          <span>Arrive about {formatTime(option.arriveAt)}</span>
        </div>
        {speechSupported() && (
          <button
            type="button"
            className="nav-icon-btn"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "Mute voice directions" : "Turn on voice directions"}
            onClick={() => {
              const next = !voiceOn;
              setVoiceOn(next);
              if (next) speak(describeStep(step));
              else stopSpeaking();
            }}
          >
            {voiceOn ? "🔊" : "🔇"}
          </button>
        )}
        <button type="button" className="nav-icon-btn" onClick={onExit} aria-label="End navigation">
          ✕
        </button>
      </div>

      {locationError && <LocationNotice code={locationError} onRetry={onRetryLocation} />}
      {!locationError && !position && (
        <p className="nav-status"><span className="spinner" /> Finding your position…</p>
      )}
      {nav.rerouting && <p className="nav-status"><span className="spinner" /> Finding a new route…</p>}
      {nav.offRoute && !nav.rerouting && <p className="nav-status nav-status-warn">You seem to be off the route.</p>}

      {step && (
        <div className="nav-current">
          <span className="nav-maneuver" aria-hidden="true">
            {step.transit ? meta.icon : MANEUVER_ICON[step.maneuver] || "⬆️"}
          </span>
          <div>
            <p className="nav-instruction">{describeStep(step)}</p>
            <p className="nav-distance">
              {nav.distanceToStepEnd != null
                ? step.transit
                  ? `Get off at ${step.transit.arrivalStop} · arrives ${formatTime(step.transit.arrivalTime)}`
                  : `${formatDistance(nav.distanceToStepEnd)} to go`
                : formatDistance(step.distanceMeters)}
            </p>
            {step.transit && (
              <p className="nav-transit-meta">
                Departs {formatTime(step.transit.departureTime)}{step.transit.agency && ` · ${step.transit.agency}`}
              </p>
            )}
          </div>
        </div>
      )}

      {nav.next && <p className="nav-next">Then: {describeStep(nav.next)}</p>}

      <div className="nav-controls">
        <button type="button" className="btn btn-ghost" onClick={() => nav.goTo(nav.index - 1)} disabled={nav.index === 0}>
          ◀ Previous
        </button>
        <span className="nav-progress">Step {nav.index + 1} of {option.steps.length}</span>
        <button type="button" className="btn btn-ghost" onClick={() => nav.goTo(nav.index + 1)} disabled={!nav.next}>
          Next ▶
        </button>
      </div>

      <button type="button" className="link-button nav-all-toggle" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
        {showAll ? "Hide all steps" : "Show all steps"}
      </button>
      {showAll && (
        <ol className="nav-step-list">
          {option.steps.map((s, i) => (
            <li key={i} className={i === nav.index ? "current" : i < nav.index ? "done" : ""}>
              {describeStep(s)} <span>{formatDistance(s.distanceMeters)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
