import { useEffect, useRef, useState } from "react";
import { getTrainsInArea } from "../lib/api";
import { useOnlineStatus } from "./useOnlineStatus";

export const TRAINS_MIN_ZOOM = 11;
const POLL_MS = 30_000;
const DEBOUNCE_MS = 600;
// The server reads stations in areas up to 0.6° × 1.0°; wider screens ask for the middle of the view
const HALF_LAT = 0.29;
const HALF_LNG = 0.49;

function clamp({ west, south, east, north }) {
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;
  return {
    west: Math.max(west, cx - HALF_LNG),
    east: Math.min(east, cx + HALF_LNG),
    south: Math.max(south, cy - HALF_LAT),
    north: Math.min(north, cy + HALF_LAT),
  };
}

const IDLE = { trains: [], status: "idle", message: "", updatedAt: null };

/**
 * Trains and Metros inside the area the map is showing, refreshed every 30 s while the page is
 * visible. Positions are estimated from live departure times (the railway doesn't share GPS).
 */
export function useAreaTrains(view, enabled) {
  const online = useOnlineStatus();
  const [state, setState] = useState(IDLE);
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
    if (viewRef.current.zoom < TRAINS_MIN_ZOOM) {
      setState({ ...IDLE, status: "zoom" });
      return undefined;
    }

    let cancelled = false;
    let timer;
    let controller;
    const bounds = clamp(viewRef.current.bounds);

    async function poll() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        setState((s) => (s.status === "ok" ? s : { ...s, status: "loading" }));
        try {
          const data = await getTrainsInArea(bounds, { signal: controller.signal });
          if (cancelled) return;
          if (data.status === "zoom-in") setState({ ...IDLE, status: "zoom" });
          else setState({ trains: data.trains, status: "ok", message: "", updatedAt: new Date() });
        } catch (err) {
          if (cancelled || controller.signal.aborted) return;
          setState((s) => ({ ...s, status: "error", message: err.message }));
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

  return enabled ? state : IDLE;
}

export function trainsStatusText(s) {
  if (s.status === "offline") return "📴 Paused. You are offline.";
  if (s.status === "zoom") return `Zoom in to see trains (zoom ${TRAINS_MIN_ZOOM}+).`;
  if (s.status === "loading") return "Loading trains…";
  if (s.status === "error") return `⚠️ ${s.message || "Trains couldn't load."}`;
  if (s.status !== "ok") return "";
  const metros = s.trains.filter((t) => t.kind === "metro").length;
  const trains = s.trains.length - metros;
  const parts = [trains && `${trains} train${trains === 1 ? "" : "s"}`, metros && `${metros} Metro${metros === 1 ? "" : "s"}`].filter(Boolean);
  const count = parts.length ? `${parts.join(" and ")} in view` : "No trains or Metros in view right now";
  return `${count} · positions estimated from live times · updated ${s.updatedAt.toLocaleTimeString("en-GB")}`;
}
