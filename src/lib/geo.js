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
    return "In Chrome: click the icon to the left of the web address → Site settings → Location → Allow (no need to reload: the app notices). A crossed-out location icon at the right of the address bar means Chrome hid the question: click it and choose Allow. On Windows also check Settings → Privacy & security → Location.";
  }
  return "Click the icon next to the web address, set Location to “Allow” (no need to reload: the app notices). On Windows also check Settings → Privacy & security → Location.";
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
 * 2. If that fails (other than being blocked), one more go asking for a precise fix, with longer.
 * The live tracking that follows (useLiveLocation) then sharpens the position.
 */
export async function getCurrentPosition() {
  if (!window.isSecureContext) throw "insecure";
  if (!("geolocation" in navigator)) throw "unsupported";
  try {
    return await requestPosition({ enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 });
  } catch (code) {
    if (code === "denied") throw code;
    return requestPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 });
  }
}
