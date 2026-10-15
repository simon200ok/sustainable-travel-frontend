import { useEffect, useState } from "react";
import { MODE_META, formatDistance, formatDuration, formatKg, formatPrice, formatTime, formatWhen } from "../../lib/format";
import JourneyDetails from "./JourneyDetails";

const UNAVAILABLE_REASON = {
  walking: "Too far to walk",
  cycling: "Too far to cycle",
  metro: "No Metro route right now",
  bus: "No bus route right now",
  train: "No train route right now",
  car_share: "No driving route found",
};

function badges(option, options) {
  const out = [];
  const fastest = Math.min(...options.map((o) => o.minutes));
  const bestScore = Math.max(...options.map((o) => o.sustainabilityScore));
  if (option.sustainabilityScore === bestScore) out.push({ text: "Greenest", tone: "green" });
  if (option.minutes === fastest) out.push({ text: "Fastest", tone: "orange" });
  return out;
}

const when = formatWhen;

function caption(result) {
  const w = result.when;
  if (w?.past) {
    return `Past timetable: ${w.type === "arrive" ? "arriving by" : "leaving at"} ${when(w.time)}. Trips still under way can be joined; finished ones can be opened to see every step.`;
  }
  if (w?.type === "arrive") return `Arriving by ${when(w.time)}. Each option shows when to leave.`;
  if (w?.type === "depart") return `Leaving at ${when(w.time)}. Times include waiting.`;
  return `Leaving now (${formatTime(result.generatedAt)}). Times include waiting.`;
}

// Where to get off the (last) bus, Metro or train, and the walk from there
// Where to get on the first bus/Metro/train and off the last one, and the walk from there
function alighting(option) {
  const rides = option.steps.filter((s) => s.transit);
  const first = rides[0]?.transit;
  const last = rides[rides.length - 1]?.transit;
  if (!first?.departureStop && !last?.arrivalStop) return null;
  const walk = option.walkAfterSeconds ? ` · ${Math.max(1, Math.round(option.walkAfterSeconds / 60))} min walk after` : "";
  const changes = option.transfers ? ` · ${option.transfers} change${option.transfers === 1 ? "" : "s"}` : "";
  const on = first?.departureStop ? `Get on at ${first.departureStop}` : "";
  const off = last?.arrivalStop ? `get off at ${last.arrivalStop}` : "";
  return `🚏 ${[on, off].filter(Boolean).join(", ")}${walk}${changes}`.replace("🚏 get", "🚏 Get");
}

export default function RouteOptions({ result, selected, onSelect, onStart, starting = false }) {
  const { options, unavailable } = result;
  const [detailsFor, setDetailsFor] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const past = Boolean(result.when?.past);

  // Past timetables: keep "under way" / "finished" up to date
  useEffect(() => {
    if (!past) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [past]);

  return (
    <div className="route-options">
      <p className="route-options-caption">
        {caption(result)}
      </p>
      <ul className="route-option-list">
        {options.map((option) => {
          const meta = MODE_META[option.mode];
          const isSelected = selected?.mode === option.mode;
          // From a past timetable: still under way (can be joined) or already finished (can be viewed)
          const finished = past && Date.parse(option.arriveAt) <= now;
          const underWay = past && !finished;
          const showDetails = isSelected && detailsFor === option.mode;
          return (
            <li key={option.mode}>
              <button
                type="button"
                className={`route-option ${isSelected ? "selected" : ""}`}
                onClick={() => onSelect(option)}
                aria-pressed={isSelected}
              >
                <span className="route-option-icon" style={{ background: meta.color }} aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="route-option-main">
                  <span className="route-option-title">
                    {option.label}
                    {option.firstTransit?.line && <span className="route-option-line">{option.firstTransit.line}</span>}
                    {badges(option, options).map((b) => (
                      <span key={b.text} className={`route-badge route-badge-${b.tone}`}>{b.text}</span>
                    ))}
                  </span>
                  <span className="route-option-meta">
                    {result.when?.type && result.when.type !== "now" ? `Leave ${formatTime(option.leaveBy || option.departAt)} · ` : ""}
                    Arrive {formatTime(option.arriveAt)} · {formatDistance(option.distanceMeters)}
                    {option.fare && option.fare.amount > 0 && ` · ${formatPrice(option.fare.amount)}`}
                  </span>
                  {alighting(option) && <span className="route-option-alight">{alighting(option)}</span>}
                  <span className="route-option-eco">
                    {option.co2SavedKg > 0
                      ? `🌱 Saves ${formatKg(option.co2SavedKg)} CO₂ vs driving alone`
                      : "🌱 Same CO₂ as driving alone"}
                    {option.kcal > 0 && ` · 🔥 ${option.kcal} kcal`}
                  </span>
                </span>
                <span className="route-option-time">
                  <strong>{formatDuration(option.minutes)}</strong>
                  {option.leaveBy && <small>leave {formatTime(option.leaveBy)}</small>}
                </span>
              </button>
              {isSelected && !finished && (
                <button type="button" className="btn btn-primary route-start" onClick={() => onStart(option)} disabled={starting}>
                  {starting ? <span className="spinner" /> : "▶"}{" "}
                  {starting ? "Updating times…" : underWay ? "Join this trip (already under way)" : `Start ${option.label.toLowerCase()} directions`}
                </button>
              )}
              {isSelected && (
                <button
                  type="button"
                  className={finished ? "btn btn-primary route-start" : "link-button route-details-toggle"}
                  aria-expanded={showDetails}
                  onClick={() => setDetailsFor(showDetails ? null : option.mode)}
                >
                  {showDetails ? "Hide journey details" : finished ? "📋 View journey details (trip has finished)" : "📋 Journey details"}
                </button>
              )}
              {showDetails && <JourneyDetails option={option} />}
            </li>
          );
        })}
      </ul>
      {unavailable.length > 0 && (
        <p className="route-unavailable">
          {unavailable.map((m) => UNAVAILABLE_REASON[m]).join(" · ")}
        </p>
      )}
    </div>
  );
}
