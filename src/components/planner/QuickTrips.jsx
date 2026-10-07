import { CAMPUS_PLACES } from "../../hooks/useSavedPlaces";

const SLOT_ICON = { home: "🏠", work: "💼" };

/** One-tap journeys: "Home → City Campus" plus trips the user starred. */
export default function QuickTrips({ places, trips, onTrip, onRemoveTrip }) {
  const chips = [];
  for (const slot of ["home", "work"]) {
    const place = places[slot];
    if (!place) continue;
    for (const campus of CAMPUS_PLACES.filter((c) => c.id !== "london")) {
      chips.push({
        key: `${slot}-${campus.id}`,
        label: `${SLOT_ICON[slot]} ${slot === "home" ? "Home" : "Work"} → ${campus.label}`,
        origin: place,
        destination: campus,
      });
    }
  }

  if (!chips.length && !trips.length) {
    return (
      <p className="quick-trips-hint">
        Tip: pick a place and tap <strong>☆ Save as Home</strong> to get one-tap trips like “Home → City Campus”.
      </p>
    );
  }

  return (
    <div className="quick-trips" role="group" aria-label="Quick trips">
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="quick-trip" onClick={() => onTrip(chip.origin, chip.destination)}>
          {chip.label}
        </button>
      ))}
      {trips.map((trip) => (
        <span key={trip.id} className="quick-trip quick-trip-saved">
          <button type="button" onClick={() => onTrip(trip.origin, trip.destination)}>
            ⭐ {trip.origin.label} → {trip.destination.label}
          </button>
          <button type="button" className="quick-trip-remove" aria-label={`Remove saved trip ${trip.id}`} onClick={() => onRemoveTrip(trip.id)}>
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
