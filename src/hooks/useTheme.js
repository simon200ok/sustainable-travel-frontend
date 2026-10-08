import { useCallback, useEffect, useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "../lib/storage";

// "light" | "dark" once the user picks one. Until then the device's own setting is used.
// (Older versions stored "system"; that counts as "not picked yet".)
const KEY = "uos-theme";
const listeners = new Set();
const media = window.matchMedia?.("(prefers-color-scheme: dark)");

function getChoice() {
  const stored = readJSON(KEY, null);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function resolveTheme(choice = getChoice()) {
  return choice ?? (media?.matches ? "dark" : "light");
}

function apply() {
  const resolved = resolveTheme();
  // Only the colours change: nothing else on the page reacts to the theme
  if (document.documentElement.dataset.theme !== resolved) document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0E1524" : "#F57C00");
  listeners.forEach((l) => l());
}

media?.addEventListener?.("change", () => {
  if (!getChoice()) apply();
});

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const resolved = useSyncExternalStore(subscribe, () => resolveTheme());

  useEffect(apply, []);

  const toggle = useCallback(() => {
    writeJSON(KEY, resolveTheme() === "dark" ? "light" : "dark");
    apply();
  }, []);

  return { resolved, toggle };
}
