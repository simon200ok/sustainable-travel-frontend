import { Link } from "react-router-dom";
import { privacySignalOn, saveChoices, usePrivacyChoices } from "../lib/consent";
import "./PrivacyChoices.css";

// Shows the map only once the visitor has allowed maps. Until then, nothing is loaded from the map provider.
export default function MapGate({ provider, children }) {
  const choices = usePrivacyChoices();
  if (choices.maps) return children;
  return (
    <div className="map-gate">
      <p className="map-gate-title">🗺️ Show the map?</p>
      <p>
        This map comes from {provider}. Loading it shares your IP address with {provider}.
      </p>
      {/* Only switches maps on: if the privacy banner hasn't been answered yet, it stays to ask about visit counting
          (unless the browser's privacy signal already rules counting out) */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => saveChoices({ maps: true, stats: choices.stats }, { answered: choices.decided || privacySignalOn() })}
      >
        Show maps
      </button>
      <p className="map-gate-note">
        This turns maps on across the app. You can change it in <Link to="/privacy#choices">privacy choices</Link>.
      </p>
    </div>
  );
}
