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

// Plain-English help for each way location can fail
export function locationErrorInfo(code) {
  const platform = detectPlatform();
  const enableSteps = {
    ios: "On iPhone: Settings → Privacy & Security → Location Services → turn it on, then set Safari Websites (or your browser) to “While Using”.",
    android: "On Android: swipe down and turn on Location, then allow this site in your browser’s site settings (tap the icon next to the address).",
    desktop: "Click the icon next to the web address, set Location to “Allow”, then reload. On Windows also check Settings → Privacy & security → Location.",
  }[platform];

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
        message: "Move somewhere with a clearer view of the sky or a better connection, then try again.",
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

export async function locationPermissionState() {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    return status?.state ?? "prompt";
  } catch {
    return "prompt";
  }
}

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) return reject("insecure");
    if (!("geolocation" in navigator)) return reject("unsupported");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(geolocationErrorCode(err)),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000, ...options },
    );
  });
}
