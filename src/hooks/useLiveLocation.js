import { useEffect, useState } from "react";
import { subscribePosition } from "../lib/geo";

function unsupportedReason() {
  if (!window.isSecureContext) return "insecure";
  if (!("geolocation" in navigator)) return "unsupported";
  return null;
}

// Continuous GPS tracking. Every page shares one browser location watch, so allowing location
// once (on any page) works everywhere, and a page that opens later gets the position at once.
export function useLiveLocation(active) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const blocked = active ? unsupportedReason() : null;

  useEffect(() => {
    if (!active || unsupportedReason()) return undefined;
    return subscribePosition(
      (next) => {
        setError(null);
        setPosition(next);
      },
      (code) => setError(code),
    );
  }, [active]);

  return { position, error: blocked || error };
}
