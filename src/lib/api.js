const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

const DEFAULT_TIMEOUT_MS = 15_000;
const cache = new Map();

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function friendlyMessage(status, serverMessage) {
  if (status === 429) return "You're doing that a lot — please wait a moment and try again.";
  if (status === 413) return "That request was too large.";
  if (status >= 500 && !serverMessage) return "Our server is having a moment. Please try again shortly.";
  return serverMessage || "Something went wrong. Please try again.";
}

async function request(path, options = {}) {
  const { cacheMs = 0, method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const key = `${method}:${path}:${body ? JSON.stringify(body) : ""}`;
  const hit = cache.get(key);

  if (hit && Date.now() - hit.time < cacheMs) return hit.data;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort(signal.reason), { once: true });

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (!navigator.onLine) throw new ApiError("You're offline. Check your connection and try again.");
    if (err?.name === "TimeoutError" || controller.signal.reason?.name === "TimeoutError") {
      throw new ApiError("The server took too long to respond. Please try again.");
    }
    throw new ApiError("Couldn't reach the server. Please try again shortly.");
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof json?.detail === "string" ? json.detail : json?.error;
    throw new ApiError(friendlyMessage(res.status, detail), res.status);
  }

  const data = json?.data ?? json;
  if (cacheMs) cache.set(key, { time: Date.now(), data });
  return data;
}

export const getHomeData = () => request("/home", { cacheMs: 60_000 });

export function getPlaceSuggestions(input, { session, near, scope = "local", signal } = {}) {
  const params = new URLSearchParams({ q: input, scope });
  if (session) params.set("session", session);
  if (near) {
    params.set("lat", near.lat.toFixed(4));
    params.set("lng", near.lng.toFixed(4));
  }
  return request(`/journey/autocomplete?${params}`, { cacheMs: 300_000, signal, timeoutMs: 8_000 });
}

export function getPlace(placeId, { session } = {}) {
  const params = session ? `?session=${encodeURIComponent(session)}` : "";
  return request(`/journey/place/${encodeURIComponent(placeId)}${params}`, { cacheMs: 86_400_000 });
}

// when: {} (leave now), { departAt: ISO } or { arriveBy: ISO }
export const planJourney = (origin, destination, when = {}) =>
  request("/journey/plan", {
    method: "POST",
    body: { origin, destination, ...when },
    timeoutMs: 25_000,
  });

export const getLiveBuses = () =>
  request("/live/buses?routes=700&routes=701", { cacheMs: 10_000, timeoutMs: 10_000 });

export const getFares = () => request("/fares", { cacheMs: 300_000 });

export const logGreenJourney = (mode, distanceMeters) =>
  request("/impact/journeys", { method: "POST", body: { mode, distance_m: Math.round(distanceMeters) } });

// Anonymous visitor counting (see lib/usage.js)
export const recordVisit = (visit) => request("/usage/visit", { method: "POST", body: visit, timeoutMs: 8_000 });

export const getCommunityImpact = () => request("/impact/summary", { cacheMs: 120_000 });

export const getOperators = (type) =>
  request(`/operators${type ? `?type=${encodeURIComponent(type)}` : ""}`, { cacheMs: 300_000 });

export const getTickets = () => request("/tickets", { cacheMs: 300_000 });

export const getZones = () => request("/zones", { cacheMs: 300_000 });

export const getLocations = () => request("/locations", { cacheMs: 300_000 });

export const sendContactMessage = (form) =>
  request("/contact", { method: "POST", body: form, timeoutMs: 20_000 });

export const getContentMeta = () => request("/content/meta", { cacheMs: 300_000 });

// Every live bus inside the map area (any operator). bounds = { west, south, east, north }
export const getVehiclesInArea = (bounds, { signal } = {}) =>
  request(
    `/live/vehicles?bbox=${[bounds.west, bounds.south, bounds.east, bounds.north].map((v) => v.toFixed(4)).join(",")}`,
    { cacheMs: 10_000, timeoutMs: 15_000, signal },
  );
