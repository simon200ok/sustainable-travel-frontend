import { useState } from "react";
import { privacySignalOn, saveChoices, usePrivacyChoices } from "../lib/consent";
import "./PrivacyChoices.css";

// Tick boxes for the optional parts of the app. Used in the first-visit banner and on the Privacy page.
export default function PrivacyChoices({ onSaved }) {
  const current = usePrivacyChoices();
  const [maps, setMaps] = useState(current.maps);
  const [stats, setStats] = useState(current.stats);
  const [saved, setSaved] = useState(false);
  const signal = privacySignalOn();

  // Choices changed elsewhere (the banner, a map's "Show maps" button, another tab): show them
  const [shown, setShown] = useState(current);
  if (shown.maps !== current.maps || shown.stats !== current.stats) {
    setShown(current);
    setMaps(current.maps);
    setStats(current.stats);
  }

  function save(e) {
    e.preventDefault();
    saveChoices({ maps, stats });
    setSaved(true);
    onSaved?.();
  }

  return (
    <form className="privacy-choices" onSubmit={save}>
      <fieldset>
        <legend className="visually-hidden">Your privacy choices</legend>
        <label className="privacy-choice">
          <input type="checkbox" checked disabled />
          <span>
            <strong>Essential (always on).</strong> Your theme, saved places and any trip in progress, kept on this
            device so the app works.
          </span>
        </label>
        <label className="privacy-choice">
          <input type="checkbox" checked={maps} onChange={(e) => { setMaps(e.target.checked); setSaved(false); }} />
          <span>
            <strong>Maps.</strong> Loads the maps from Google Maps (journey planner and trips) and OpenStreetMap (Live
            Map). They receive your IP address and basic device details when a map loads. Without maps, journeys still
            work as written steps.
          </span>
        </label>
        <label className="privacy-choice">
          <input
            type="checkbox"
            checked={stats}
            disabled={signal}
            onChange={(e) => { setStats(e.target.checked); setSaved(false); }}
          />
          <span>
            <strong>Anonymous visit counting.</strong> Helps us see how many people use the app. No cookies, IDs or IP
            addresses are stored.
            {signal && " Your browser sends a Global Privacy Control signal, so this browser is never counted."}
          </span>
        </label>
      </fieldset>
      <div className="privacy-choices-actions">
        <button type="submit" className="btn btn-primary">Save my choices</button>
        <span role="status" className="privacy-choices-saved">{saved ? "✅ Saved." : ""}</span>
      </div>
    </form>
  );
}
