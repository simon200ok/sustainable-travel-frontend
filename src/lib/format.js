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

export function transitLabel(type) {
  if (!type) return "Transit";
  if (["BUS", "INTERCITY_BUS", "TROLLEYBUS"].includes(type)) return "Bus";
  if (["SUBWAY", "METRO_RAIL", "LIGHT_RAIL", "TRAM", "MONORAIL"].includes(type)) return "Metro";
  return "Train";
}
