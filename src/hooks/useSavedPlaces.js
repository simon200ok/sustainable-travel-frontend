import { useCallback, useSyncExternalStore } from "react";
import { CAMPUSES } from "../lib/geo";
import { readJSON, writeJSON } from "../lib/storage";

// Saved on this device only: no account needed and nothing personal leaves the phone
const PLACES_KEY = "uos-saved-places";
const TRIPS_KEY = "uos-saved-trips";
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let placesSnapshot = readJSON(PLACES_KEY, {});
let tripsSnapshot = readJSON(TRIPS_KEY, []);

export const CAMPUS_PLACES = CAMPUSES.map((c) => ({ ...c, kind: "campus" }));

export function useSavedPlaces() {
  const places = useSyncExternalStore(subscribe, () => placesSnapshot);
  const trips = useSyncExternalStore(subscribe, () => tripsSnapshot);

  const savePlace = useCallback((slot, place) => {
    placesSnapshot = { ...placesSnapshot, [slot]: { label: place.label, lat: place.lat, lng: place.lng } };
    writeJSON(PLACES_KEY, placesSnapshot);
    emit();
  }, []);

  const removePlace = useCallback((slot) => {
    const { [slot]: _removed, ...rest } = placesSnapshot;
    placesSnapshot = rest;
    writeJSON(PLACES_KEY, placesSnapshot);
    emit();
  }, []);

  const saveTrip = useCallback((origin, destination, summary = null) => {
    const id = `${origin.label}→${destination.label}`;
    const trip = {
      id,
      origin: { label: origin.label, lat: origin.lat, lng: origin.lng },
      destination: { label: destination.label, lat: destination.lat, lng: destination.lng },
      summary,
      savedAt: new Date().toISOString(),
    };
    tripsSnapshot = [trip, ...tripsSnapshot.filter((t) => t.id !== id)].slice(0, 8);
    writeJSON(TRIPS_KEY, tripsSnapshot);
    emit();
  }, []);

  const removeTrip = useCallback((id) => {
    tripsSnapshot = tripsSnapshot.filter((t) => t.id !== id);
    writeJSON(TRIPS_KEY, tripsSnapshot);
    emit();
  }, []);

  return { places, trips, savePlace, removePlace, saveTrip, removeTrip };
}
