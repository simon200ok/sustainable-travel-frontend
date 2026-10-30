import { useEffect, useMemo, useState } from "react";
import { getStopsAlong } from "../lib/api";
import { alongPath, stepPath, stopKind, TYPICAL_SPEED, vehicleKind } from "../lib/navigation";

const FRESH_FIX_MS = 30_000; // an older GPS reading (e.g. underground) means "estimate from the timetable"
const MAX_ACCURACY_M = 150;
const MAX_OFF_LINE_M = 300; // further than this from the line, GPS isn't telling us where on it you are
// How close counts as "at" a stop (stations are long, and GPS on a train wanders)
const AT_STOP_M = { bus: 35, metro: 150, rail: 250 };

/**
 * The stops on the bus / Metro / train you're riding, and where you are among them.
 * Returns { status: "none" | "loading" | "ok" | "unavailable", stops, now, next, toGo, secondsToNext,
 * estimated, exact, started, kind }. Each stop has state "done" | "now" | "next" | "ahead", and the
 * first and last have role "board" / "alight".
 */
export function useRideStops(step, position, speed) {
  const kind = stopKind(step);
  const key = kind && step?.polyline ? `${kind}:${step.polyline}` : null;
  const [data, setData] = useState(null); // { key, stops, exact } or { key, failed: true }
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    getStopsAlong(step, kind)
      .then((res) => {
        if (cancelled) return;
        setData(res.status === "ok" ? { key, stops: res.stops || [], exact: !!res.exact } : { key, failed: true });
      })
      .catch(() => !cancelled && setData({ key, failed: true }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const path = useMemo(() => (key ? stepPath(step) : []), [key, step]);
  const length = useMemo(() => (path.length ? alongPath(path[path.length - 1], path).length : 0), [path]);

  // Ordered list with the boarding and alighting stops at the ends
  const list = useMemo(() => {
    if (!key || data?.key !== key || data.failed) return null;
    const t = step.transit;
    const start = t.departureStopLocation || step.start || path[0];
    const end = step.end || path[path.length - 1];
    const middle = data.stops
      .map((s) => ({ ...s, along: alongPath(s, path).along }))
      .sort((a, b) => a.along - b.along);
    return [
      { name: t.departureStop || "Where you get on", lat: start.lat, lng: start.lng, along: 0, role: "board" },
      ...middle,
      { name: t.arrivalStop || "Where you get off", lat: end.lat, lng: end.lng, along: length, role: "alight" },
    ];
  }, [key, data, step, path, length]);

  const fix = position && path.length && (position.accuracy ?? 0) < MAX_ACCURACY_M ? alongPath(position, path) : null;
  const seenOnLine = fix && fix.offset < MAX_OFF_LINE_M;
  const onLine = seenOnLine && Date.now() - (position.at || 0) < FRESH_FIX_MS;
  // Last place GPS put you on the line: the timetable estimate never goes back behind it
  const lastSeenAlong = seenOnLine ? fix.along : 0;

  // Check again every 15 s even when no GPS reading arrives: once the last one is too old
  // (e.g. underground), the estimate switches to the timetable and keeps moving with the clock
  useEffect(() => {
    if (!list) return undefined;
    const timer = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, [list]);

  return useMemo(() => {
    if (!key) return { status: "none" };
    if (data?.key !== key) return { status: "loading", kind };
    if (!list) return { status: "unavailable", kind };

    let userAlong = null;
    let estimated = false;
    if (onLine) {
      userAlong = fix.along;
    } else {
      const dep = Date.parse(step.transit.departureTime);
      const arr = Date.parse(step.transit.arrivalTime);
      if (Number.isFinite(dep) && Number.isFinite(arr) && arr > dep) {
        userAlong = Math.max(lastSeenAlong, Math.max(0, Math.min(1, (Date.now() - dep) / (arr - dep))) * length);
        estimated = true;
      }
    }
    if (userAlong == null) return { status: "ok", kind, stops: list.map((s) => ({ ...s, state: "ahead" })), exact: data.exact };

    const near = AT_STOP_M[kind];
    let nowIndex = -1;
    list.forEach((s, i) => {
      const d = Math.abs(s.along - userAlong);
      if (d <= near && (nowIndex < 0 || d < Math.abs(list[nowIndex].along - userAlong))) nowIndex = i;
    });
    let nextIndex = nowIndex >= 0 ? nowIndex + 1 : list.findIndex((s) => s.along > userAlong);
    if (nextIndex >= list.length) nextIndex = -1;
    const firstAhead = nextIndex >= 0 ? nextIndex : list.length;
    const stops = list.map((s, i) => ({
      ...s,
      state: i === nowIndex ? "now" : i === nextIndex ? "next" : i < firstAhead ? "done" : "ahead",
    }));
    const next = nextIndex >= 0 ? stops[nextIndex] : null;
    const v = speed > 2 ? speed : TYPICAL_SPEED[vehicleKind(step)];
    return {
      status: "ok",
      kind,
      stops,
      now: nowIndex >= 0 ? stops[nowIndex] : null,
      next,
      toGo: nextIndex >= 0 ? list.length - nextIndex : 0,
      secondsToNext: next ? Math.max(0, (next.along - userAlong) / v) : null,
      estimated,
      exact: data.exact,
      started: userAlong > near,
    };
    // tick: re-estimate from the timetable every 15 s while there's no GPS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, data, list, onLine, fix?.along, lastSeenAlong, length, kind, speed, step, tick]);
}
