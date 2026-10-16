export const SUNDERLAND = { lat: 54.906, lng: -1.385 };

export const CAMPUSES = [
  { id: "city", label: "City Campus", lat: 54.90439, lng: -1.39179 },
  { id: "st-peters", label: "St Peter's Campus", lat: 54.9116, lng: -1.373 },
  { id: "london", label: "London Campus", lat: 51.50014, lng: -0.01424 },
];

export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (/CriOS/i.test(ua)) return "chrome-ios";
  if (/FxiOS|Firefox/i.test(ua)) return "firefox";
  if (/Edg/i.test(ua)) return "edge";
  if (/Chrome|Chromium/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  return "other";
}

// Where to switch location on, for this phone/computer and browser
export function locationHelp() {
  const platform = detectPlatform();
  const browser = detectBrowser();
  if (platform === "ios") {
    if (browser === "chrome-ios") {
      return "On iPhone: Settings → Chrome → Location → “While Using the App”, and turn on Precise Location. Then come back, reload and tap Allow.";
    }
    return "On iPhone: Settings → Privacy & Security → Location Services → turn it on, then set Safari Websites (or your browser) to “While Using”.";
  }
  if (platform === "android") {
    return "On Android: swipe down and turn on Location, then tap the icon next to the web address → Permissions → Location → Allow.";
  }
  if (browser === "chrome") {
    return "In Chrome: click the icon to the left of the web address → Site settings → Location → Allow, then click “I've allowed it. Try again”. A crossed-out location icon at the right of the address bar means Chrome hid the question: click it and choose Allow. On Windows also check Settings → Privacy & security → Location.";
  }
  return "Click the icon next to the web address, set Location to “Allow”, then click “I've allowed it. Try again”. On Windows also check Settings → Privacy & security → Location.";
}

// Plain-English help for each way location can fail
export function locationErrorInfo(code) {
  const enableSteps = locationHelp();

  switch (code) {
    case "denied":
      return {
        title: "Location access is blocked",
        message: `We need your location to start journeys from where you are and to guide you live. ${enableSteps}`,
      };
    case "unavailable":
      return {
        title: "We can't find your location",
        message: `Your device's location (GPS) seems to be switched off or has no signal. ${enableSteps}`,
      };
    case "timeout":
      return {
        title: "Finding your location is taking too long",
        message: `Make sure location is allowed for this site, then try again. ${enableSteps}`,
      };
    case "insecure":
      return {
        title: "Location needs a secure connection",
        message: "Open the app using its https:// address to use your location.",
      };
    case "unsupported":
      return {
        title: "Location isn't supported",
        message: "This browser can't share your location. Type your starting point instead.",
      };
    default:
      return { title: "Location problem", message: "Type your starting point instead, or try again." };
  }
}

export function geolocationErrorCode(error) {
  if (!error) return "unknown";
  if (typeof error === "string") return error;
  if (error.code === 1) return "denied";
  if (error.code === 2) return "unavailable";
  if (error.code === 3) return "timeout";
  return "unknown";
}

/**
 * Calls onChange("granted" | "prompt" | "denied") whenever the user changes this site's location
 * setting in the browser. Resolves to an unsubscribe function, or null if the browser can't
 * report changes (then a reload is the only way to notice).
 */
export async function watchLocationPermission(onChange) {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    if (!status || !("onchange" in status)) return null;
    const handler = () => onChange(status.state);
    status.addEventListener("change", handler);
    return () => status.removeEventListener("change", handler);
  } catch {
    return null;
  }
}

export async function locationPermissionState() {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    return status?.state ?? "prompt";
  } catch {
    return "prompt";
  }
}

// The latest position the app has (from any request or from live tracking), shared by every page
let lastFix = null;
const ALLOWED_KEY = "uos-location-ok";

export function rememberPosition(p) {
  if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) lastFix = { lat: p.lat, lng: p.lng, accuracy: p.accuracy, at: Date.now() };
  noteAllowed(true);
}

export function recentPosition(maxAgeMs = 60_000) {
  return lastFix && Date.now() - lastFix.at <= maxAgeMs ? lastFix : null;
}

// Location was given somewhere in the app during this visit. Some browsers (Safari) report "prompt"
// even after the person has said yes, so this lets every page know without asking again.
function noteAllowed(ok) {
  try {
    if (ok) sessionStorage.setItem(ALLOWED_KEY, "1");
    else sessionStorage.removeItem(ALLOWED_KEY);
  } catch {
    // private browsing: the browser's own permission state is still used
  }
}

/** True when location can be used without the browser asking (allowed already, here or on another page). */
export async function locationAlreadyAllowed() {
  if (!window.isSecureContext || !("geolocation" in navigator)) return false;
  const state = await locationPermissionState();
  if (state === "granted") return true;
  if (state === "denied") return false;
  if (recentPosition()) return true;
  try {
    return sessionStorage.getItem(ALLOWED_KEY) === "1";
  } catch {
    return false;
  }
}

// One live location watch shared by every part of the app (journey planner, trip, Live Map).
// Pages subscribe and unsubscribe; the GPS stays on only while at least one page is listening.
const listeners = new Set();
let watchId = null;
let latest = null; // the newest full reading (with heading and speed)

function startSharedWatch() {
  if (watchId !== null || listeners.size === 0) return;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      latest = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        at: pos.timestamp,
      };
      rememberPosition(latest);
      for (const l of listeners) l.onPosition(latest);
    },
    (err) => {
      const code = geolocationErrorCode(err);
      if (code === "denied") {
        // Stop, so the watch can start afresh once the person allows location again
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        latest = null;
        noteAllowed(false);
      }
      for (const l of listeners) l.onError(code);
    },
    { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
  );
}

/** Follows the user's position. Returns a function that stops following. */
export function subscribePosition(onPosition, onError) {
  const listener = { onPosition, onError };
  listeners.add(listener);
  // A page that joins late gets the newest reading straight away
  if (latest && Date.now() - latest.at <= 60_000) onPosition(latest);
  startSharedWatch();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };
}

// Keeps listening until the first fix arrives (Chrome on Windows often answers this way when a
// one-off request times out). Stops straight away if location is blocked.
function firstFixFromWatch(timeoutMs) {
  return new Promise((resolve, reject) => {
    let done = false;
    let id = null;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (id !== null) navigator.geolocation.clearWatch(id);
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, "timeout"), timeoutMs);
    id = navigator.geolocation.watchPosition(
      (pos) => finish(resolve, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        if (geolocationErrorCode(err) === "denied") finish(reject, "denied");
        // other errors: keep waiting until the time limit
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  });
}

function requestPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(geolocationErrorCode(err)),
      options,
    );
  });
}

/**
 * Where the user is, as quickly as the browser can say.
 * 1. A quick, approximate fix (Wi-Fi/mobile network, or one from the last 5 minutes). Some
 *    browsers (Chrome especially) are slow to give a "precise" fix and would otherwise time out.
 * 2. If that fails (other than being blocked), keep listening for a precise fix for up to 30 s.
 * A position the app already has from the last minute is used straight away.
 * The live tracking that follows (useLiveLocation) then sharpens the position.
 */
export async function getCurrentPosition() {
  if (!window.isSecureContext) throw "insecure";
  if (!("geolocation" in navigator)) throw "unsupported";
  const recent = recentPosition();
  if (recent) return recent;
  let pos;
  try {
    pos = await requestPosition({ enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 });
  } catch (code) {
    if (code === "denied") {
      noteAllowed(false);
      throw code;
    }
    pos = await firstFixFromWatch(30_000);
  }
  rememberPosition(pos);
  startSharedWatch(); // restarts live tracking for any page that was waiting (e.g. after "Allow")
  return pos;
}
