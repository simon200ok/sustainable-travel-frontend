import { useEffect, useRef, useState } from "react";
import { getStopsNear } from "../lib/api";
import { distanceMeters } from "../lib/geo";

const REFRESH_AFTER_M = 75; // ask again once you've walked this far
const RADIUS_M = 400;

/**
 * While walking: the nearest bus stop and the nearest station (rail or Metro), with live distances.
 * Returns { stop, station } (either may be null).
 */
export function useNearbyStops(position, enabled) {
  const [found, setFound] = useState([]);
  const asked = useRef(null);
  const latest = useRef(0);

  // Not cancelled when the next GPS reading arrives (that would cancel every request);
  // only the newest request's answer is used
  useEffect(() => {
    if (!enabled || !position) return;
    if (asked.current && distanceMeters(asked.current, position) < REFRESH_AFTER_M) return;
    asked.current = { lat: position.lat, lng: position.lng };
    const id = ++latest.current;
    getStopsNear({ lat: position.lat, lng: position.lng, radius: RADIUS_M, limit: 10 })
      .then((res) => id === latest.current && setFound(res.stops || []))
      .catch(() => {});
  }, [enabled, position]);

  useEffect(() => {
    if (!enabled) asked.current = null; // ask afresh on the next walking step
  }, [enabled]);

  if (!enabled || !position) return { stop: null, station: null };
  const withDistance = found
    .map((s) => ({ ...s, distanceM: distanceMeters(position, s) }))
    .filter((s) => s.distanceM <= RADIUS_M)
    .sort((a, b) => a.distanceM - b.distanceM);
  return {
    stop: withDistance.find((s) => s.kind === "bus") || null,
    station: withDistance.find((s) => s.kind !== "bus") || null,
  };
}
