import { useState } from "react";
import { Link } from "react-router-dom";
import { saveChoices, usePrivacyChoices } from "../lib/consent";
import PrivacyChoices from "./PrivacyChoices";
import "./PrivacyChoices.css";

// Asked once, on the first visit. Until the visitor chooses, no maps or visit counting load.
export default function PrivacyBanner() {
  const choices = usePrivacyChoices();
  const [choosing, setChoosing] = useState(false);
  if (choices.decided) return null;

  // Maps already switched on from a map's "Show maps" button: only visit counting is left to ask about
  const mapsOn = choices.maps;

  return (
    <section className="privacy-banner" aria-labelledby="privacy-banner-title">
      <div className="container">
        <h2 id="privacy-banner-title" className="privacy-banner-title">Your privacy choices</h2>
        {mapsOn ? (
          <p>
            Maps are on. We'd also like to count visits anonymously, with no cookies or IDs, to see how many people use
            the app. Is that OK? More in our <Link to="/privacy">Privacy Notice</Link>.
          </p>
        ) : (
          <p>
            The maps here come from Google Maps and OpenStreetMap, and loading them shares your IP address with them. We'd
            also like to count visits anonymously, with no cookies or IDs. Nothing optional loads until you choose. More
            in our <Link to="/privacy">Privacy Notice</Link>.
          </p>
        )}
        {choosing ? (
          <PrivacyChoices />
        ) : (
          <div className="privacy-banner-actions">
            {/* The yes and no buttons look the same, so neither is pushed */}
            <button type="button" className="privacy-banner-btn" onClick={() => saveChoices({ maps: true, stats: true })}>
              {mapsOn ? "Count my visits" : "Allow all"}
            </button>
            <button type="button" className="privacy-banner-btn" onClick={() => saveChoices({ maps: mapsOn, stats: false })}>
              {mapsOn ? "No thanks" : "Essential only"}
            </button>
            <button type="button" className="privacy-banner-link" onClick={() => setChoosing(true)}>
              Choose
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
