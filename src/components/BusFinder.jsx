import { useEffect, useState } from "react";
import { searchBuses } from "../lib/api";
import { formatDistance } from "../lib/format";
import { stopLabel } from "../lib/navigation";

const ROUTE = /^[A-Za-z0-9]{1,6}$/;
const SHOWN = 8;

function ago(iso) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  return s < 60 ? `${s} s ago` : `${Math.round(s / 60)} min ago`;
}

function towards(bus) {
  return bus.destination ? `to ${bus.destination}` : "";
}

// Re-renders every few seconds so "updated 20 s ago" stays true
function useClock(ms, on) {
  const [, setNow] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms, on]);
}

/**
 * "Find a bus": search live buses by route number near you (or the map), then track one.
 * near: { lat, lng, label } where to search. results/onResults: the list (shown on the map too).
 */
export default function BusFinder({ near, results, onResults, tracked, tracking, onTrack, onStopTracking, onShow, following, onFollow }) {
  const [route, setRoute] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [shared, setShared] = useState("");
  useClock(5000, !!results || !!tracked);

  async function search(e) {
    e.preventDefault();
    const wanted = route.trim().toUpperCase();
    if (!ROUTE.test(wanted)) {
      setError("Type a route number, like 20 or X1.");
      return;
    }
    setError("");
    setBusy(true);
    setShowAll(false);
    try {
      const res = await searchBuses(wanted, near);
      onResults({ route: res.route || wanted, vehicles: res.vehicles || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const bus = tracking.bus;
    if (!bus) return;
    const params = new URLSearchParams({
      route: tracked.route,
      op: tracked.operatorRef,
      bus: tracked.vehicleRef,
      at: `${bus.lat.toFixed(3)},${bus.lng.toFixed(3)}`,
    });
    const url = `${window.location.origin}/map?${params}`;
    const title = `Bus ${tracked.route} ${towards(bus)}`.trim();
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Follow ${title} live`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared("Link copied");
    } catch (err) {
      if (err?.name !== "AbortError") setShared("Couldn't share the link");
    }
    setTimeout(() => setShared(""), 4000);
  }

  if (tracked) {
    const { bus, stop, status } = tracking;
    return (
      <section className="bus-finder bus-tracking" aria-label={`Tracking bus ${tracked.route}`}>
        <div className="bus-tracking-head">
          <span className="bus-finder-route" aria-hidden="true">{tracked.route}</span>
          <div className="bus-tracking-text" role="status" aria-live="polite">
            <strong>
              Bus {tracked.route} {bus ? towards(bus) : ""}
            </strong>
            <span>
              {status === "finding" && !bus && "Finding the bus…"}
              {bus && (
                <>
                  {bus.operatorName || bus.operatorRef}
                  {" · "}
                  {status === "lost" ? `last seen ${ago(bus.recordedAt)}. It may have finished its journey or stopped sending its position.` : `updated ${ago(bus.recordedAt)}`}
                </>
              )}
              {status === "lost" && !bus && "This bus isn't sending its position right now."}
            </span>
            {bus && stop && status !== "lost" && (
              <span>
                🚏 Near <strong>{stop.name}</strong>
                {stopLabel(stop) && ` (${stopLabel(stop)})`}
              </span>
            )}
            {tracking.error && <span className="bus-finder-error">⚠️ {tracking.error}</span>}
          </div>
        </div>
        <div className="bus-tracking-actions">
          <button type="button" className={`btn btn-ghost ${following ? "active" : ""}`} aria-pressed={following} onClick={() => onFollow(!following)} disabled={!bus}>
            {following ? "◎ Following" : "◎ Follow"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={share} disabled={!bus}>
            🔗 Share
          </button>
          <button type="button" className="btn btn-primary" onClick={onStopTracking}>
            Stop tracking
          </button>
          {shared && <span className="bus-finder-note" role="status">{shared}</span>}
        </div>
        <p className="bus-finder-note">Live position from the bus operator (Bus Open Data Service). Updates every 10 seconds.</p>
      </section>
    );
  }

  const list = results?.vehicles || [];
  return (
    <section className="bus-finder" aria-label="Find a bus">
      <form className="bus-finder-form" onSubmit={search} role="search">
        <label htmlFor="bus-finder-route">🔍 Find a bus</label>
        <input
          id="bus-finder-route"
          value={route}
          onChange={(e) => setRoute(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6))}
          placeholder="Route, e.g. 20 or X1"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          aria-describedby="bus-finder-where"
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <span className="spinner" /> : "Search"}
        </button>
        {results && (
          <button type="button" className="btn btn-ghost" onClick={() => onResults(null)}>
            Clear
          </button>
        )}
      </form>
      <p id="bus-finder-where" className="bus-finder-note">Searches about 40 km {near.label}.</p>
      {error && <p className="bus-finder-error" role="alert">⚠️ {error}</p>}

      {results && (
        <div role="status" aria-live="polite">
          {list.length === 0 ? (
            <p className="bus-finder-note">
              No route {results.route} buses are sending their position near here right now. Buses only appear while they're in service.
            </p>
          ) : (
            <>
              <p className="bus-finder-count">
                Bus {results.route}: {list.length} live {near.label.startsWith("around you") ? "near you" : "in this area"}, nearest first
              </p>
              <ul className="bus-finder-results">
                {(showAll ? list : list.slice(0, SHOWN)).map((bus) => (
                  <li key={`${bus.operatorRef}-${bus.vehicleRef}`}>
                    <button type="button" className="bus-finder-show" onClick={() => onShow(bus)} title="Show on the map">
                      <span className="bus-finder-route" aria-hidden="true">{bus.route}</span>
                      <span>
                        <strong>{towards(bus) || `Bus ${bus.route}`}</strong>
                        <span className="bus-finder-meta">
                          {bus.operatorName || bus.operatorRef} · {formatDistance(bus.distanceM)} away · updated {ago(bus.recordedAt)}
                        </span>
                      </span>
                    </button>
                    <button type="button" className="btn btn-primary bus-finder-track" onClick={() => onTrack(bus)} disabled={!bus.vehicleRef}>
                      Track
                    </button>
                  </li>
                ))}
              </ul>
              {list.length > SHOWN && !showAll && (
                <button type="button" className="link-button" onClick={() => setShowAll(true)}>
                  Show all {list.length}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
