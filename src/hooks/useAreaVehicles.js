import { useEffect, useRef, useState } from "react";
import { getVehiclesInArea } from "../lib/api";
import { distanceMeters } from "../lib/geo";
import { useOnlineStatus } from "./useOnlineStatus";

export const LIVE_MIN_ZOOM = 12;
const POLL_MS = 20_000;
const DEBOUNCE_MS = 600;
// The server accepts areas up to 0.6° × 0.35°; wider screens ask for the middle of the view
// (leaving room for the grid below)
const HALF_LNG = 0.28;
const HALF_LAT = 0.16;
// Small views (a trip map zoomed in on you) load at least about 3 km around their middle, so buses
// heading your way are already there when they come into view
const MIN_HALF_LNG = 0.025;
const MIN_HALF_LAT = 0.015;
// The area asked for is snapped to a grid, so a map that moves with you (or a small drag) keeps
// asking for the same area instead of restarting the request every second
const GRID = 0.01;

export function clampBounds({ west, south, east, north }) {
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;
  return {
    west: Math.max(west, cx - HALF_LNG),
    east: Math.min(east, cx + HALF_LNG),
    south: Math.max(south, cy - HALF_LAT),
    north: Math.min(north, cy + HALF_LAT),
  };
}

// The national feed sometimes leaves a bus out of one update; keep it for up to a minute
// rather than making it blink off the map
const KEEP_MISSING_MS = 60_000;
const vehicleKey = (v) => `${v.operatorRef}-${v.vehicleRef || `${v.route}-${v.lat}-${v.lng}`}`;

export function keepRecentlySeen(before, now, area, nowMs = Date.now()) {
  const fresh = new Set(now.map(vehicleKey));
  const kept = before.filter(
    (v) =>
      !fresh.has(vehicleKey(v)) &&
      nowMs - (v.seenAt ?? 0) < KEEP_MISSING_MS &&
      v.lat >= area.south && v.lat <= area.north && v.lng >= area.west && v.lng <= area.east,
  );
  return [...now.map((v) => ({ ...v, seenAt: nowMs })), ...kept];
}

/** The area to load for a map view: the view (at most the server's limit), at least ~3 km across, snapped outwards to the grid. */
export function requestArea(viewBounds) {
  const c = clampBounds(viewBounds);
  const cx = (c.west + c.east) / 2;
  const cy = (c.south + c.north) / 2;
  const snap = (v, round) => Number((round(v / GRID) * GRID).toFixed(4));
  return {
    west: snap(Math.min(c.west, cx - MIN_HALF_LNG), Math.floor),
    south: snap(Math.min(c.south, cy - MIN_HALF_LAT), Math.floor),
    east: snap(Math.max(c.east, cx + MIN_HALF_LNG), Math.ceil),
    north: snap(Math.max(c.north, cy + MIN_HALF_LAT), Math.ceil),
  };
}

/**
 * Live buses (every operator) in and around the area the map is showing.
 * `view` = { bounds: { west, south, east, north }, zoom }; only that area is loaded,
 * and it's refreshed every 20 s while the page is visible.
 */
export function useAreaVehicles(view, enabled) {
  const online = useOnlineStatus();
  const [state, setState] = useState({ vehicles: [], total: 0, status: "idle", message: "", updatedAt: null });
  const zoomedIn = (view?.zoom ?? 0) >= LIVE_MIN_ZOOM;
  const area = view?.bounds ? requestArea(view.bounds) : null;
  const areaRef = useRef(area);
  areaRef.current = area;
  const areaKey = area ? `${zoomedIn}|${area.west}|${area.south}|${area.east}|${area.north}` : "";

  useEffect(() => {
    if (!enabled || !areaKey) return undefined;
    if (!online) {
      setState((s) => ({ ...s, status: "offline" }));
      return undefined;
    }
    if (!zoomedIn) {
      setState({ vehicles: [], total: 0, status: "zoom", message: "", updatedAt: null });
      return undefined;
    }

    let cancelled = false;
    let timer;
    let controller;
    const bounds = areaRef.current;

    async function poll() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        setState((s) => (s.status === "ok" ? s : { ...s, status: "loading" }));
        try {
          const data = await getVehiclesInArea(bounds, { signal: controller.signal });
          if (cancelled) return;
          setState((s) => {
            const vehicles = keepRecentlySeen(s.vehicles, data.vehicles, bounds);
            return { vehicles, total: vehicles.length, status: "ok", message: "", updatedAt: new Date() };
          });
        } catch (err) {
          if (cancelled || controller.signal.aborted) return;
          setState((s) => ({ ...s, vehicles: err.status === 422 ? [] : s.vehicles, status: "error", message: err.message }));
        }
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }

    timer = setTimeout(poll, DEBOUNCE_MS);
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
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, online, areaKey, zoomedIn]);

  return enabled ? state : { vehicles: [], total: 0, status: "idle", message: "", updatedAt: null };
}

/**
 * Bus positions from the Bus Open Data Service are usually 10–60 seconds old, so a bus on the map
 * trails the real one. Using its last two reports (speed) and its heading, move it forward by
 * how old the report is (at most 45 s), so it lines up with where the bus really is now.
 */
export function projectVehicle(v, previous, nowMs = Date.now()) {
  const at = Date.parse(v.recordedAt);
  if (!previous || !Number.isFinite(at) || !Number.isFinite(v.bearing)) return v;
  const seconds = (at - previous.at) / 1000;
  if (seconds < 5 || seconds > 180) return v;
  const speed = distanceMeters(previous, v) / seconds;
  if (speed < 1 || speed > 35) return v; // stopped, or a GPS jump
  const ahead = speed * Math.min(45, Math.max(0, (nowMs - at) / 1000));
  const rad = (v.bearing * Math.PI) / 180;
  return {
    ...v,
    lat: v.lat + (ahead * Math.cos(rad)) / 111_320,
    lng: v.lng + (ahead * Math.sin(rad)) / (111_320 * Math.cos((v.lat * Math.PI) / 180)),
  };
}

export function areaStatusText(state) {
  switch (state.status) {
    case "zoom":
      return "🔍 Zoom in to see live buses in this area.";
    case "loading":
      return "Loading live buses…";
    case "offline":
      return "📴 Live buses paused. You are offline.";
    case "error":
      return `⚠️ ${state.message}`;
    case "ok":
      return state.vehicles.length
        ? `🟢 ${state.total} live bus${state.total === 1 ? "" : "es"} nearby · updated ${state.updatedAt.toLocaleTimeString("en-GB")}`
        : "No live buses reporting in this area right now.";
    default:
      return "";
  }
}
