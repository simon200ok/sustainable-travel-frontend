import { registerSW } from "virtual:pwa-register";

/*
 * App updates.
 * 1. Opening the app always fetches the newest page first (see vite.config.js: network-first),
 *    so a new version is normally picked up as the app opens, with no reload.
 * 2. If a new version arrives while the app is in use:
 *    - in the first few seconds, before anything is typed and with no trip running: switch quietly;
 *    - otherwise: show "A new version is ready. Refresh" (UpdateBanner);
 *    - never reload during a trip.
 */
const THIS_BUILD = import.meta.env.VITE_BUILD_ID;
const QUIET_WINDOW_MS = 8000;
const CHECK_EVERY_MS = 30 * 60 * 1000;

let typed = false;
window.addEventListener("input", () => { typed = true; }, { capture: true, once: true });

export function tripRunning() {
  try {
    const trip = JSON.parse(window.localStorage.getItem("uos-active-trip") || "null");
    return Boolean(trip && !trip.arrived);
  } catch {
    return false;
  }
}

async function latestBuild() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    return res.ok ? (await res.json()).build ?? null : null;
  } catch {
    return null;
  }
}

let updateSW = null;
let ready = false;
const listeners = new Set();

/** Called when a new version is waiting and the user should choose when to refresh. */
export function onUpdateReady(listener) {
  listeners.add(listener);
  if (ready) listener();
  return () => listeners.delete(listener);
}

function activate({ reload }) {
  if (reload) {
    navigator.serviceWorker?.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    setTimeout(() => window.location.reload(), 4000); // in case the switch-over event never comes
  }
  updateSW?.();
}

/** The "Refresh" button. */
export function refreshNow() {
  activate({ reload: true });
}

export function startAppUpdates() {
  if (!("serviceWorker" in navigator)) return;
  updateSW = registerSW({
    immediate: true,
    // We decide when to reload (the plugin would otherwise reload straight away)
    onNeedReload() {},
    async onNeedRefresh() {
      const latest = await latestBuild();
      if (latest && latest === THIS_BUILD) {
        // This page is already the newest version (it was fetched fresh): just update the offline copy
        activate({ reload: false });
        return;
      }
      if (performance.now() < QUIET_WINDOW_MS && !typed && !tripRunning()) {
        activate({ reload: true });
        return;
      }
      ready = true;
      listeners.forEach((listener) => listener());
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Look for new versions while the app stays open, and when it's brought back to the front
      setInterval(() => registration.update().catch(() => {}), CHECK_EVERY_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    },
  });
}
