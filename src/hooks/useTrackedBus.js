import { useEffect, useRef, useState } from "react";
import { getStopsNear, searchBuses } from "../lib/api";
import { distanceMeters } from "../lib/geo";

const POLL_MS = 10_000;
const LOST_AFTER_POLLS = 3; // about 30 s without the bus in the live feed
const TRAIL_POINTS = 30;
const STOP_REFRESH_M = 80;

const sameBus = (a, b) => a.operatorRef === b.operatorRef && a.vehicleRef === b.vehicleRef;

/**
 * Follows one live bus. target: { route, operatorRef, vehicleRef, lat, lng } (lat/lng: where it was
 * last seen, so the search looks in the right area). Returns { bus, trail, stop, status, error }
 * with status "finding" | "ok" | "lost".
 */
export function useTrackedBus(target) {
  const [state, setState] = useState({ key: null, bus: null, trail: [], stop: null, misses: 0, error: "" });
  const key = target ? `${target.route}|${target.operatorRef}|${target.vehicleRef}` : null;
  const lastSeen = useRef(null);
  const stopAsked = useRef(null);

  useEffect(() => {
    if (!target) return undefined;
    lastSeen.current = { lat: target.lat, lng: target.lng };
    stopAsked.current = null;
    let cancelled = false;
    let timer;

    async function poll() {
      // Paused while the page is hidden: saves the person's data and the shared feed
      if (document.visibilityState === "visible") {
        try {
          const res = await searchBuses(target.route, lastSeen.current);
          if (cancelled) return;
          const bus = (res.vehicles || []).find((v) => sameBus(v, target));
          if (bus) {
            lastSeen.current = { lat: bus.lat, lng: bus.lng };
            setState((s) => {
              const fresh = s.key === key ? s : { key, trail: [], stop: null };
              const last = fresh.trail[fresh.trail.length - 1];
              const trail = !last || distanceMeters(last, bus) > 5 ? [...fresh.trail, { lat: bus.lat, lng: bus.lng }].slice(-TRAIL_POINTS) : fresh.trail;
              return { ...fresh, key, bus, trail, misses: 0, error: "" };
            });
            // The stop it's at or coming up to (on its side of the road)
            if (!stopAsked.current || distanceMeters(stopAsked.current, bus) > STOP_REFRESH_M) {
              stopAsked.current = { lat: bus.lat, lng: bus.lng };
              getStopsNear({ lat: bus.lat, lng: bus.lng, radius: 250, kind: "bus", heading: bus.bearing, limit: 1 })
                .then((r) => !cancelled && setState((s) => (s.key === key ? { ...s, stop: r.stops?.[0] || null } : s)))
                .catch(() => {});
            }
          } else {
            setState((s) => (s.key === key ? { ...s, misses: s.misses + 1 } : { key, bus: null, trail: [], stop: null, misses: 1, error: "" }));
          }
        } catch (err) {
          if (!cancelled) setState((s) => ({ ...(s.key === key ? s : { key, bus: null, trail: [], stop: null, misses: 0 }), error: err.message }));
        }
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }

    poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!target) return { status: "off", bus: null, trail: [], stop: null, error: "" };
  const mine = state.key === key ? state : { bus: null, trail: [], stop: null, misses: 0, error: "" };
  const status = mine.misses >= LOST_AFTER_POLLS ? "lost" : mine.bus ? "ok" : "finding";
  return { status, bus: mine.bus, trail: mine.trail, stop: mine.stop, error: mine.error };
}
