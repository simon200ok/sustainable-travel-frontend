import { useEffect, useState } from "react";
import { useJourney } from "../context/JourneyContext";
import { onUpdateReady, refreshNow } from "../lib/appUpdate";

// "A new version is ready. Refresh": shown when an update arrives while the app is in use.
// Hidden during a trip, so nobody is interrupted mid-journey; it appears again afterwards.
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [later, setLater] = useState(false);
  const journey = useJourney();
  const onTrip = Boolean(journey?.trip && !journey.trip.arrived);

  useEffect(() => onUpdateReady(() => setReady(true)), []);

  if (!ready || later || onTrip) return null;
  return (
    <div className="update-toast update-banner" role="status">
      <span aria-hidden="true">✨</span>
      <span className="update-banner-text">A new version of the app is ready.</span>
      <button type="button" className="app-banner-btn" onClick={refreshNow}>
        Refresh
      </button>
      <button type="button" className="app-banner-close update-banner-close" onClick={() => setLater(true)} aria-label="Not now">
        ✕
      </button>
    </div>
  );
}
