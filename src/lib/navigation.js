import { distanceMeters } from "./geo";

// Google encoded-polyline decoder (runs on-device, no extra API calls)
export function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ["lat", "lng"]) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === "lat") lat += delta;
      else lng += delta;
    }
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Distance from a point to a segment, using a local flat projection (accurate at city scale)
function distanceToSegment(p, a, b) {
  const k = Math.cos((p.lat * Math.PI) / 180) * 111_320;
  const ax = a.lng * k;
  const ay = a.lat * 110_540;
  const bx = b.lng * k;
  const by = b.lat * 110_540;
  const px = p.lng * k;
  const py = p.lat * 110_540;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distanceToPath(point, path) {
  if (!path.length) return Infinity;
  if (path.length === 1) return distanceMeters(point, path[0]);
  let best = Infinity;
  for (let i = 1; i < path.length; i += 1) {
    best = Math.min(best, distanceToSegment(point, path[i - 1], path[i]));
  }
  return best;
}

export function stepPath(step) {
  const decoded = decodePolyline(step.polyline);
  if (decoded.length) return decoded;
  return [step.start, step.end].filter(Boolean);
}

export function boundsOf(points) {
  if (!points.length) return null;
  return points.reduce(
    (b, p) => ({
      north: Math.max(b.north, p.lat),
      south: Math.min(b.south, p.lat),
      east: Math.max(b.east, p.lng),
      west: Math.min(b.west, p.lng),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  );
}

export function describeStep(step) {
  if (step.transit) {
    const t = step.transit;
    const stops = t.stopCount ? `, ${t.stopCount} stop${t.stopCount === 1 ? "" : "s"}` : "";
    return `Take the ${t.line || t.vehicleName || "service"} towards ${t.headsign || "your destination"} from ${t.departureStop}. Get off at ${t.arrivalStop}${stops}.`;
  }
  return step.instruction || (step.travelMode === "WALK" ? "Walk to the next point" : "Continue");
}
