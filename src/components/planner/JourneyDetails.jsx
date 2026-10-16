import { MODE_META, formatDistance, formatDuration, formatKg, formatPrice, formatTime, formatWhen, transitLabel, vehicleIcon } from "../../lib/format";
import { describeStep } from "../../lib/navigation";
import PlatformInfo from "./PlatformInfo";

const MOVE = {
  WALK: { icon: "🚶", verb: "Walk" },
  BICYCLE: { icon: "🚲", verb: "Cycle" },
  DRIVE: { icon: "🚗", verb: "Drive" },
};

// Consecutive walking/cycling/driving steps become one segment (with its turn-by-turn directions inside)
function segments(steps) {
  const out = [];
  for (const step of steps) {
    if (step.transit) {
      out.push({ type: "ride", step });
      continue;
    }
    const last = out[out.length - 1];
    if (last?.type === "move" && last.mode === step.travelMode) {
      last.steps.push(step);
      last.distance += step.distanceMeters || 0;
      last.seconds += step.durationSeconds || 0;
    } else {
      out.push({ type: "move", mode: step.travelMode, steps: [step], distance: step.distanceMeters || 0, seconds: step.durationSeconds || 0 });
    }
  }
  return out;
}

/** The whole journey, step by step: every walk, bus, Metro or train, stops and times. */
export default function JourneyDetails({ option }) {
  const parts = segments(option.steps || []);
  const rides = parts.filter((p) => p.type === "ride").length;
  const leave = option.leaveBy || option.departAt;

  return (
    <div className="journey-details">
      <p className="journey-details-summary">
        <strong>
          {leave && `Leave ${formatWhen(leave)} → `}Arrive {formatWhen(option.arriveAt)}
        </strong>
        <span>
          {formatDuration(option.minutes)} · {formatDistance(option.distanceMeters)}
          {rides > 0 && ` · ${rides} ${rides === 1 ? "ride" : "rides"}`}
          {option.fare?.amount > 0 && ` · ${formatPrice(option.fare.amount)}`}
          {option.co2SavedKg > 0 && ` · saves ${formatKg(option.co2SavedKg)} CO₂`}
        </span>
      </p>

      <ol className="journey-timeline">
        {parts.map((part, i) => {
          if (part.type === "ride") {
            const t = part.step.transit;
            const kind = transitLabel(t.vehicleType);
            const badge = t.color ? { background: t.color, color: t.textColor || "#fff" } : { background: MODE_META[option.mode]?.color || "#333", color: "#fff" };
            return (
              <li key={i} className="tl-ride" style={{ "--tl-color": t.color || MODE_META[option.mode]?.color || "var(--uos-orange)" }}>
                <span className="tl-icon" aria-hidden="true">{vehicleIcon(t.vehicleType)}</span>
                <div className="tl-body">
                  <p className="tl-title">
                    {t.line && <span className="tl-line" style={badge}>{t.line}</span>} {kind}
                    {t.headsign && ` towards ${t.headsign}`}
                  </p>
                  <p className="tl-stop">
                    <span className="tl-time">{formatTime(t.departureTime)}</span> Get on at <strong>{t.departureStop}</strong>
                  </p>
                  <PlatformInfo step={part.step} />
                  <p className="tl-sub">
                    {t.stopCount ? `${t.stopCount} stop${t.stopCount === 1 ? "" : "s"}` : "Ride"} · {formatDistance(part.step.distanceMeters)}
                    {t.agency && ` · ${t.agency}`}
                  </p>
                  <p className="tl-stop">
                    <span className="tl-time">{formatTime(t.arrivalTime)}</span> Get off at <strong>{t.arrivalStop}</strong>
                  </p>
                </div>
              </li>
            );
          }
          const move = MOVE[part.mode] || MOVE.WALK;
          return (
            <li key={i} className="tl-move">
              <span className="tl-icon" aria-hidden="true">{move.icon}</span>
              <div className="tl-body">
                <p className="tl-title">
                  {move.verb} {formatDistance(part.distance)}
                  {part.seconds > 0 && ` · about ${formatDuration(Math.max(1, Math.round(part.seconds / 60)))}`}
                </p>
                <details className="tl-directions">
                  <summary>Directions ({part.steps.length} step{part.steps.length === 1 ? "" : "s"})</summary>
                  <ol>
                    {part.steps.map((s, k) => (
                      <li key={k}>
                        {describeStep(s)} <span className="tl-sub">{formatDistance(s.distanceMeters)}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              </div>
            </li>
          );
        })}
        <li className="tl-end">
          <span className="tl-icon" aria-hidden="true">🏁</span>
          <div className="tl-body">
            <p className="tl-title">Arrive {formatWhen(option.arriveAt)}</p>
          </div>
        </li>
      </ol>
    </div>
  );
}
