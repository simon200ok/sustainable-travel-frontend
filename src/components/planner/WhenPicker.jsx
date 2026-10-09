import { useEffect, useId, useState } from "react";
import { formatTime } from "../../lib/format";

const CHOICES = [
  { type: "now", label: "Leave now" },
  { type: "depart", label: "Depart at" },
  { type: "arrive", label: "Arrive by" },
];
const pad = (n) => String(n).padStart(2, "0");

// <input type="datetime-local"> works in local time: "YYYY-MM-DDTHH:MM"
function toLocalInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function roundedLater(minutes) {
  const d = new Date(Date.now() + minutes * 60_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

/** "Leave now" (the default, kept up to date), or a chosen departure or arrival time. */
export default function WhenPicker({ value, onChange }) {
  const inputId = useId();
  const [clock, setClock] = useState(() => new Date());

  // Keep "Leave now" showing the current time
  useEffect(() => {
    if (value.type !== "now") return undefined;
    const timer = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(timer);
  }, [value.type]);

  function choose(type) {
    if (type === "now") onChange({ type, time: null });
    else onChange({ type, time: value.time ?? roundedLater(type === "arrive" ? 60 : 15) });
  }

  return (
    <div className="when-picker">
      <div className="planner-scope when-choices" role="radiogroup" aria-label="When are you travelling?">
        {CHOICES.map((c) => (
          <button
            key={c.type}
            type="button"
            role="radio"
            aria-checked={value.type === c.type}
            className={value.type === c.type ? "active" : ""}
            onClick={() => choose(c.type)}
          >
            {c.type === "now" ? `🕒 ${c.label}` : c.label}
            {c.type === "now" && value.type === "now" && <span className="when-clock"> · {formatTime(clock.toISOString())}</span>}
          </button>
        ))}
      </div>
      {value.type !== "now" && (
        <label className="when-time" htmlFor={inputId}>
          <span className="visually-hidden">{value.type === "arrive" ? "Arrival time" : "Departure time"}</span>
          {/* No min/step: browsers reject times off their own grid ("enter a valid value"); past departures mean "now" and the server checks the 60-day limit */}
          <input
            id={inputId}
            type="datetime-local"
            value={value.time ? toLocalInput(value.time) : ""}
            onChange={(e) => {
              const time = e.target.value ? new Date(e.target.value) : null;
              if (time && !Number.isNaN(time.getTime())) onChange({ type: value.type, time });
            }}
          />
        </label>
      )}
    </div>
  );
}

/** What to send to the server for the chosen time. */
// eslint-disable-next-line react-refresh/only-export-components
export function whenPayload(value) {
  if (value.type === "now" || !value.time) return {};
  // A departure time that has already passed just means "now"
  if (value.type === "depart" && value.time.getTime() <= Date.now()) return {};
  return value.type === "arrive" ? { arriveBy: value.time.toISOString() } : { departAt: value.time.toISOString() };
}
