import { Link } from "react-router-dom";
import { saveChoices, usePrivacyChoices } from "../lib/consent";
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
      <button type="button" className="btn btn-primary" onClick={() => saveChoices({ ...choices, maps: true })}>
        Show maps
      </button>
      <p className="map-gate-note">
        This turns maps on across the app. You can change it in <Link to="/privacy#choices">privacy choices</Link>.
      </p>
    </div>
  );
}
