import { useEffect, useRef, useState } from "react";
import { getVehiclesInArea } from "../lib/api";
import { distanceMeters } from "../lib/geo";
import { useOnlineStatus } from "./useOnlineStatus";

export const LIVE_MIN_ZOOM = 12;
const POLL_MS = 20_000;
const DEBOUNCE_MS = 600;
// The server accepts areas up to 0.6° × 0.35°; wider screens ask for the middle of the view
const HALF_LNG = 0.29;
const HALF_LAT = 0.17;

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

/**
 * Live buses (every operator) inside the area the map is showing.
 * `view` = { bounds: { west, south, east, north }, zoom }; only that area is loaded,
 * and it's refreshed every 20 s while the page is visible.
 */
export function useAreaVehicles(view, enabled) {
  const online = useOnlineStatus();
  const [state, setState] = useState({ vehicles: [], total: 0, status: "idle", message: "", updatedAt: null });
  const viewRef = useRef(view);
  viewRef.current = view;
  const b = view?.bounds;
  const viewKey = b ? `${view.zoom}|${b.west.toFixed(3)}|${b.south.toFixed(3)}|${b.east.toFixed(3)}|${b.north.toFixed(3)}` : "";

  useEffect(() => {
    if (!enabled || !viewKey) return undefined;
    if (!online) {
      setState((s) => ({ ...s, status: "offline" }));
      return undefined;
    }
    if (viewRef.current.zoom < LIVE_MIN_ZOOM) {
      setState({ vehicles: [], total: 0, status: "zoom", message: "", updatedAt: null });
      return undefined;
    }

    let cancelled = false;
    let timer;
    let controller;
    const bounds = clampBounds(viewRef.current.bounds);

    async function poll() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        setState((s) => (s.status === "ok" ? s : { ...s, status: "loading" }));
        try {
          const data = await getVehiclesInArea(bounds, { signal: controller.signal });
          if (cancelled) return;
          setState({ vehicles: data.vehicles, total: data.total, status: "ok", message: "", updatedAt: new Date() });
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
  }, [enabled, online, viewKey]);

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
      return "📴 Live buses paused — you are offline.";
    case "error":
      return `⚠️ ${state.message}`;
    case "ok":
      return state.vehicles.length
        ? `🟢 ${state.total} live bus${state.total === 1 ? "" : "es"} in view · updated ${state.updatedAt.toLocaleTimeString("en-GB")}`
        : "No live buses reporting in this area right now.";
    default:
      return "";
  }
}
