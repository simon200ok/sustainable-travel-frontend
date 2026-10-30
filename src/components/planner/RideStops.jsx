import { useState } from "react";
import { formatDistance } from "../../lib/format";
import { stopLabel } from "../../lib/navigation";

function name(stop) {
  const label = stopLabel(stop);
  return label ? `${stop.name} (${label})` : stop.name;
}

function inAbout(seconds) {
  if (seconds == null) return "";
  if (seconds < 45) return "any moment";
  return `about ${Math.max(1, Math.round(seconds / 60))} min`;
}

/** On a bus / Metro / train: where you are among its stops, and the full list. */
export function RideStops({ ride }) {
  const [open, setOpen] = useState(false);
  if (!ride || ride.status === "none" || ride.status === "unavailable") return null;
  if (ride.status === "loading") {
    return (
      <p className="ride-loading">
        <span className="spinner" /> Loading the stops on this route…
      </p>
    );
  }
  const word = ride.kind === "bus" ? "stop" : "station";
  const { now, next, toGo, stops } = ride;

  return (
    <div className="ride-stops">
      {(now || next) && (
        <div className="ride-now">
          {now && (
            <p>
              <span className="ride-label">Now at</span> <strong>{name(now)}</strong>
            </p>
          )}
          {next && (
            <p>
              <span className="ride-label ride-label-next">Next</span> <strong>{name(next)}</strong>
              {ride.secondsToNext != null && <span className="ride-when"> · {inAbout(ride.secondsToNext)}</span>}
            </p>
          )}
          {toGo > 0 && (
            <p className="ride-togo">
              {next?.role === "alight" ? `Your ${word} is next. Get ready to get off.` : `${ride.exact ? "" : "About "}${toGo} ${word}s to go`}
            </p>
          )}
          {ride.estimated && <p className="ride-note">Estimated from the timetable (no GPS signal right now).</p>}
        </div>
      )}

      <button type="button" className="link-button ride-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? `Hide the ${word}s` : `Show all ${stops.length} ${word}s`}
      </button>
      {open && (
        <>
          {/* Scrolls when long: focusable so it can be scrolled with the keyboard */}
          <ol className="ride-stop-list" tabIndex={0} aria-label={`${word === "stop" ? "Stops" : "Stations"} on this route`}>
            {stops.map((s, i) => (
              <li
                key={s.atco || `${s.role}-${i}`}
                className={`ride-stop ride-stop-${s.state}${s.role ? ` ride-stop-${s.role}` : ""}`}
                aria-current={s.state === "now" ? "location" : undefined}
              >
                <span className="ride-dot" aria-hidden="true" />
                <span className="ride-stop-name">{name(s)}</span>
                {s.role === "board" && <span className="ride-tag">Get on</span>}
                {s.role === "alight" && <span className="ride-tag ride-tag-off">Get off</span>}
                {s.state === "done" && <span className="visually-hidden"> (passed)</span>}
                {s.state === "now" && <span className="visually-hidden"> (you are here)</span>}
                {s.state === "next" && <span className="visually-hidden"> (next)</span>}
              </li>
            ))}
          </ol>
          {!ride.exact && (
            <p className="ride-note">
              {ride.kind === "bus"
                ? "These are the stops along the route. The bus may not stop at every one."
                : "These are the stations along the line. Your service may not stop at every one."}
            </p>
          )}
          <p className="ride-credit">Stop data: NaPTAN, Department for Transport (OGL v3.0)</p>
        </>
      )}
    </div>
  );
}

/** While walking: the nearest bus stop and station. */
export function NearbyStops({ nearby }) {
  if (!nearby?.stop && !nearby?.station) return null;
  return (
    <ul className="ride-nearby" aria-label="Nearby stops">
      {nearby.stop && (
        <li>
          🚏 Nearest bus stop: <strong>{name(nearby.stop)}</strong>, {formatDistance(nearby.stop.distanceM)}
        </li>
      )}
      {nearby.station && (
        <li>
          {nearby.station.kind === "metro" ? "🚇" : "🚉"} Nearest {nearby.station.kind === "metro" ? "Metro station" : "station"}:{" "}
          <strong>{nearby.station.name}</strong>, {formatDistance(nearby.station.distanceM)}
        </li>
      )}
    </ul>
  );
}
