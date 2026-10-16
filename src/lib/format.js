const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export const formatTime = (iso) => (iso ? timeFormatter.format(new Date(iso)) : "");

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDistance(meters) {
  if (meters == null) return "";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

// "14:05", or "Sat 10 Oct, 14:05" when it isn't today
export function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? formatTime(iso) : `${dayFormatter.format(d)}, ${formatTime(iso)}`;
}

export const formatPrice = (value) => `£${Number(value).toFixed(2)}`;

export function formatKg(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  if (kg >= 10) return `${Math.round(kg)} kg`;
  return `${kg.toFixed(1)} kg`;
}

export function minutesUntil(iso, now = Date.now()) {
  return Math.round((new Date(iso).getTime() - now) / 60_000);
}

export const MODE_META = {
  walking: { icon: "🚶", color: "#2E7D32" },
  cycling: { icon: "🚲", color: "#00897B" },
  metro: { icon: "🚇", color: "#C9A400" },
  bus: { icon: "🚌", color: "#E30613" },
  train: { icon: "🚆", color: "#003366" },
  car_share: { icon: "🚗", color: "#6D4C41" },
};

// The picture for one ride, from the vehicle Google names for that step (a bus ride and a
// train ride in the same journey each get their own picture)
export function vehicleIcon(type) {
  if (["BUS", "INTERCITY_BUS", "TROLLEYBUS", "SHARE_TAXI"].includes(type)) return "🚌";
  if (["TRAM", "LIGHT_RAIL"].includes(type)) return "🚊";
  if (["SUBWAY", "METRO_RAIL", "MONORAIL"].includes(type)) return "🚇";
  if (type === "FERRY") return "⛴️";
  if (["CABLE_CAR", "GONDOLA_LIFT", "FUNICULAR"].includes(type)) return "🚡";
  if (["RAIL", "HEAVY_RAIL", "COMMUTER_TRAIN", "HIGH_SPEED_TRAIN", "LONG_DISTANCE_TRAIN"].includes(type)) return "🚆";
  return "🚍";
}

export function transitLabel(type) {
  if (!type) return "Transit";
  if (["BUS", "INTERCITY_BUS", "TROLLEYBUS"].includes(type)) return "Bus";
  if (["SUBWAY", "METRO_RAIL", "LIGHT_RAIL", "TRAM", "MONORAIL"].includes(type)) return "Metro";
  return "Train";
}
