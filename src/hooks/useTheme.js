import { useCallback, useEffect, useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "../lib/storage";

const KEY = "uos-theme"; // "light" | "dark" | "system"
const listeners = new Set();
const media = window.matchMedia?.("(prefers-color-scheme: dark)");

function getPreference() {
  return readJSON(KEY, "system");
}

export function resolveTheme(preference = getPreference()) {
  if (preference === "light" || preference === "dark") return preference;
  return media?.matches ? "dark" : "light";
}

function apply() {
  const resolved = resolveTheme();
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0E1524" : "#F57C00");
  listeners.forEach((l) => l());
}

media?.addEventListener?.("change", apply);

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getPreference);
  const resolved = useSyncExternalStore(subscribe, () => resolveTheme(preference));

  useEffect(apply, []);

  const setPreference = useCallback((next) => {
    writeJSON(KEY, next);
    apply();
  }, []);

  return { preference, resolved, setPreference };
}
