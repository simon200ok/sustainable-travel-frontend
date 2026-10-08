import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";

// The trip being navigated lives above the pages, so changing page never stops it.
// It's also saved on the device, so a refresh (or the phone closing the app) resumes it.
const KEY = "uos-active-trip";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

const JourneyContext = createContext(null);

function loadTrip() {
  const trip = readJSON(KEY, null);
  if (!trip?.option?.steps?.length || !trip.destination || trip.arrived) return null;
  if (Date.now() - trip.startedAt > MAX_AGE_MS) return null;
  return trip;
}

export function JourneyProvider({ children }) {
  const [trip, setTrip] = useState(loadTrip);

  useEffect(() => {
    if (trip) writeJSON(KEY, trip);
    else {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        // storage blocked: nothing to clear
      }
    }
  }, [trip]);

  const startTrip = useCallback((origin, destination, option) => {
    const now = Date.now();
    setTrip({ id: now, startedAt: now, origin, destination, option, minimised: false, arrived: false });
  }, []);

  const updateTrip = useCallback((patch) => setTrip((t) => (t ? { ...t, ...patch } : t)), []);
  const endTrip = useCallback(() => setTrip(null), []);

  const value = useMemo(() => ({ trip, startTrip, updateTrip, endTrip }), [trip, startTrip, updateTrip, endTrip]);
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJourney() {
  return useContext(JourneyContext);
}
