import { useEffect, useState } from "react";
import { geolocationErrorCode } from "../lib/geo";

function unsupportedReason() {
  if (!window.isSecureContext) return "insecure";
  if (!("geolocation" in navigator)) return "unsupported";
  return null;
}

// Continuous GPS tracking while navigating
export function useLiveLocation(active) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const blocked = active ? unsupportedReason() : null;

  useEffect(() => {
    if (!active || unsupportedReason()) return undefined;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          at: pos.timestamp,
        });
      },
      (err) => setError(geolocationErrorCode(err)),
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  return { position, error: blocked || error };
}
