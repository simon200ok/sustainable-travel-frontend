import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { logGreenJourney } from "../lib/api";
import { readJSON, writeJSON } from "../lib/storage";

// Personal tracker lives on the device; the server only receives an anonymous total
const KEY = "uos-green-journeys";
const listeners = new Set();
let snapshot = readJSON(KEY, []);
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function termStart(now = new Date()) {
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 8, 1);
}

export function computeStreak(journeys, now = new Date()) {
  const days = new Set(journeys.map((j) => dayKey(j.at)));
  const cursor = new Date(now);
  // A streak survives until the end of today even if today has no journey yet
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The part of a route option actually travelled: its CO₂ saving and calories in proportion to the distance. */
export function travelledPart(option, metres) {
  const total = option?.distanceMeters || 0;
  const m = Math.max(0, Math.min(total, metres));
  const share = total ? m / total : 0;
  return { mode: option?.mode, distanceMeters: Math.round(m), co2SavedKg: (option?.co2SavedKg || 0) * share, kcal: Math.round((option?.kcal || 0) * share) };
}

/**
 * One journey from its parts (the routes before each re-route, then the route that arrived).
 * Counted as the way of travelling used for the longest distance.
 */
export function combineParts(parts) {
  const byMode = {};
  for (const p of parts) byMode[p.mode] = (byMode[p.mode] || 0) + p.distanceMeters;
  const mode = Object.keys(byMode).sort((a, b) => byMode[b] - byMode[a])[0];
  return {
    mode,
    distanceMeters: parts.reduce((s, p) => s + p.distanceMeters, 0),
    co2SavedKg: Math.round(parts.reduce((s, p) => s + p.co2SavedKg, 0) * 1000) / 1000,
    kcal: parts.reduce((s, p) => s + p.kcal, 0),
  };
}

export function useImpact() {
  const journeys = useSyncExternalStore(subscribe, () => snapshot);
  const [openedAt] = useState(() => Date.now());

  const stats = useMemo(() => {
    const start = termStart().getTime();
    const thisTerm = journeys.filter((j) => new Date(j.at).getTime() >= start);
    const weekAgo = openedAt - 7 * 86_400_000;
    return {
      termKg: thisTerm.reduce((sum, j) => sum + j.co2SavedKg, 0),
      termJourneys: thisTerm.length,
      weekKg: journeys.filter((j) => new Date(j.at).getTime() >= weekAgo).reduce((s, j) => s + j.co2SavedKg, 0),
      kcal: thisTerm.reduce((sum, j) => sum + (j.kcal || 0), 0),
      streak: computeStreak(journeys),
      totalJourneys: journeys.length,
    };
  }, [journeys, openedAt]);

  const recordJourney = useCallback((option) => {
    const entry = {
      at: new Date().toISOString(),
      mode: option.mode,
      distanceMeters: option.distanceMeters,
      co2SavedKg: option.co2SavedKg,
      kcal: option.kcal || 0,
    };
    snapshot = [entry, ...snapshot].slice(0, 1000);
    writeJSON(KEY, snapshot);
    listeners.forEach((l) => l());
    // Best effort: feeds the anonymous campus-wide counter
    logGreenJourney(option.mode, option.distanceMeters, option.co2SavedKg).catch(() => {});
  }, []);

  return { journeys, stats, recordJourney };
}
