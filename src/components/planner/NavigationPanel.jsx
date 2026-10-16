import { useState } from "react";
import { formatDistance, formatKg, formatTime, MODE_META } from "../../lib/format";
import { describeStep } from "../../lib/navigation";
import { speak, speechSupported } from "../../lib/speech";
import LocationNotice from "../LocationNotice";
import PlatformInfo from "./PlatformInfo";

// eslint-disable-next-line react-refresh/only-export-components
export const MANEUVER_ICON = {
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

// Guidance runs in ActiveNavigation (so it continues on every page); this panel only shows it
export default function NavigationPanel({ option, destination, position, locationError, onRetryLocation, nav, voiceOn, onToggleVoice, onExit, impact }) {
  const [showAll, setShowAll] = useState(false);
  // Looking at another step (Previous / Next / the step list) never moves live guidance,
  // which keeps tracking where you really are; "Back to current step" returns to it
  const [viewIndex, setViewIndex] = useState(null);
  const meta = MODE_META[option.mode];
  const steps = option.steps;
  const viewing = viewIndex != null && viewIndex !== nav.index && viewIndex < steps.length;
  const shownIndex = viewing ? viewIndex : nav.index;
  const step = steps[shownIndex];
  const nextStep = steps[shownIndex + 1];
  const view = (i) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, i));
    setViewIndex(clamped === nav.index ? null : clamped);
    if (voiceOn) speak(describeStep(steps[clamped]));
  };

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
          <p>Thanks for sharing the car. Fewer cars means cleaner air for Sunderland.</p>
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
          {/* Live estimate: follows your real progress (and late buses), not just the original plan */}
          <span>Arrive about {formatTime((nav.eta ?? new Date(option.arriveAt)).toISOString())}</span>
        </div>
        {speechSupported() && (
          <button
            type="button"
            className="nav-icon-btn"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "Mute voice directions" : "Turn on voice directions"}
            onClick={onToggleVoice}
          >
            {voiceOn ? "🔊" : "🔇"}
          </button>
        )}
        <button type="button" className="nav-icon-btn" onClick={onExit} aria-label="End navigation" title="End journey">
          ✕
        </button>
      </div>

      {locationError && <LocationNotice code={locationError} onRetry={onRetryLocation} />}
      {!locationError && !position && (
        <p className="nav-status"><span className="spinner" /> Finding your position…</p>
      )}
      {nav.rerouting && <p className="nav-status"><span className="spinner" /> Finding a new route…</p>}
      {nav.offRoute && !nav.rerouting && <p className="nav-status nav-status-warn">You seem to be off the route.</p>}
      {nav.alightAlert && <p className="nav-alight" role="alert">{nav.alightAlert}</p>}

      {viewing && (
        <div className="nav-viewing" role="status">
          <span>
            Viewing step {shownIndex + 1} ({shownIndex < nav.index ? "already done" : "coming up"}). You're on step {nav.index + 1}.
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setViewIndex(null)}>
            Back to current step
          </button>
        </div>
      )}

      {step && (
        <div className={`nav-current ${viewing ? "nav-current-viewing" : ""}`}>
          <span className="nav-maneuver" aria-hidden="true">
            {step.transit ? meta.icon : MANEUVER_ICON[step.maneuver] || "⬆️"}
          </span>
          <div>
            <p className="nav-instruction">{describeStep(step)}</p>
            {step.transit ? (
              <>
                <p className="nav-stop">
                  <span className="nav-stop-label">Get on</span> <strong>{step.transit.departureStop || "first stop"}</strong>
                  {step.transit.departureTime && ` · departs ${formatTime(step.transit.departureTime)}`}
                </p>
                <p className="nav-stop">
                  <span className="nav-stop-label">Get off</span> <strong>{step.transit.arrivalStop || "your stop"}</strong>
                  {step.transit.arrivalTime && ` · arrives ${formatTime(step.transit.arrivalTime)}`}
                </p>
                <p className="nav-transit-meta">
                  {step.transit.stopCount ? `${step.transit.stopCount} stop${step.transit.stopCount === 1 ? "" : "s"}` : ""}
                  {step.transit.agency && `${step.transit.stopCount ? " · " : ""}${step.transit.agency}`}
                </p>
                <PlatformInfo step={step} />
              </>
            ) : (
              <p className="nav-distance">
                {!viewing && nav.distanceToStepEnd != null ? `${formatDistance(nav.distanceToStepEnd)} to go` : formatDistance(step.distanceMeters)}
              </p>
            )}
          </div>
        </div>
      )}

      {nextStep && <p className="nav-next">Then: {describeStep(nextStep)}</p>}

      <div className="nav-controls">
        <button type="button" className="btn btn-ghost" onClick={() => view(shownIndex - 1)} disabled={shownIndex === 0}>
          ◀ Previous
        </button>
        <span className="nav-progress">Step {shownIndex + 1} of {steps.length}</span>
        <button type="button" className="btn btn-ghost" onClick={() => view(shownIndex + 1)} disabled={!nextStep}>
          Next ▶
        </button>
      </div>

      <button type="button" className="link-button nav-all-toggle" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
        {showAll ? "Hide all steps" : "Show all steps"}
      </button>
      {showAll && (
        <ol className="nav-step-list">
          {steps.map((s, i) => (
            <li key={i} className={`${i === nav.index ? "current" : i < nav.index ? "done" : ""} ${i === shownIndex && viewing ? "viewing" : ""}`}>
              <button type="button" className="nav-step-btn" onClick={() => view(i)} aria-current={i === nav.index ? "step" : undefined}>
                {describeStep(s)} <span>{formatDistance(s.distanceMeters)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
