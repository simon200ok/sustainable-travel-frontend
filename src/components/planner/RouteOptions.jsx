import { MODE_META, formatDistance, formatDuration, formatKg, formatPrice, formatTime } from "../../lib/format";

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

const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

// "14:05", or "Sat 10 Oct, 14:05" when it isn't today
function when(iso) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? formatTime(iso) : `${dayFormatter.format(d)}, ${formatTime(iso)}`;
}

function caption(result) {
  const w = result.when;
  if (w?.type === "arrive") return `Arriving by ${when(w.time)}. Each option shows when to leave.`;
  if (w?.type === "depart") return `Leaving at ${when(w.time)}. Times include waiting.`;
  return `Leaving now (${formatTime(result.generatedAt)}). Times include waiting.`;
}

// Where to get off the (last) bus, Metro or train, and the walk from there
function alighting(option) {
  const rides = option.steps.filter((s) => s.transit);
  const last = rides[rides.length - 1]?.transit;
  if (!last?.arrivalStop) return null;
  const walk = option.walkAfterSeconds ? ` · ${Math.max(1, Math.round(option.walkAfterSeconds / 60))} min walk after` : "";
  return `🚏 Get off at ${last.arrivalStop}${walk}${option.transfers ? ` · ${option.transfers} change${option.transfers === 1 ? "" : "s"}` : ""}`;
}

export default function RouteOptions({ result, selected, onSelect, onStart, starting = false }) {
  const { options, unavailable } = result;

  return (
    <div className="route-options">
      <p className="route-options-caption">
        {caption(result)}
      </p>
      <ul className="route-option-list">
        {options.map((option) => {
          const meta = MODE_META[option.mode];
          const isSelected = selected?.mode === option.mode;
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
              {isSelected && (
                <button type="button" className="btn btn-primary route-start" onClick={() => onStart(option)} disabled={starting}>
                  {starting ? <span className="spinner" /> : "▶"} {starting ? "Updating times…" : `Start ${option.label.toLowerCase()} directions`}
                </button>
              )}
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
