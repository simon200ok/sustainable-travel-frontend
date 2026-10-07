import { useEffect, useState } from "react";
import { getCommunityImpact } from "../lib/api";
import { formatKg } from "../lib/format";
import { useImpact } from "../hooks/useImpact";

// ~21 kg CO2 absorbed by one mature tree per year
const KG_PER_TREE_YEAR = 21;

export default function ImpactCard() {
  const { stats } = useImpact();
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    getCommunityImpact().then(setCommunity).catch(() => setCommunity(null));
  }, []);

  const trees = stats.termKg / KG_PER_TREE_YEAR;

  return (
    <section className="impact-card" aria-labelledby="impact-title">
      <div className="impact-personal">
        <h2 id="impact-title" className="impact-title">Your green travel</h2>
        {stats.totalJourneys === 0 ? (
          <p className="impact-empty">
            Start directions for a walk, cycle, bus, Metro or train trip and we'll track the CO₂ you save — right here on your device.
          </p>
        ) : (
          <>
            <p className="impact-headline">
              You've saved <strong>{formatKg(stats.termKg)} CO₂</strong> this term
            </p>
            <ul className="impact-stats">
              <li>
                <span className="impact-stat-value">🔥 {stats.streak}</span>
                <span className="impact-stat-label">day streak</span>
              </li>
              <li>
                <span className="impact-stat-value">{stats.termJourneys}</span>
                <span className="impact-stat-label">green trips</span>
              </li>
              <li>
                <span className="impact-stat-value">{formatKg(stats.weekKg)}</span>
                <span className="impact-stat-label">saved this week</span>
              </li>
              {stats.kcal > 0 && (
                <li>
                  <span className="impact-stat-value">{stats.kcal.toLocaleString("en-GB")}</span>
                  <span className="impact-stat-label">kcal burned</span>
                </li>
              )}
            </ul>
            {trees >= 0.1 && (
              <p className="impact-trees">🌳 That's what {trees.toFixed(1)} tree{trees >= 1.05 ? "s" : ""} absorb in a year.</p>
            )}
          </>
        )}
      </div>
      {community && community.term.journeys > 0 && (
        <div className="impact-community">
          <span className="impact-community-label">Team UoS this term</span>
          <span className="impact-community-value">{formatKg(community.term.co2SavedKg)} CO₂ saved</span>
          <span className="impact-community-sub">
            {community.term.journeys.toLocaleString("en-GB")} green trips · {community.week.journeys.toLocaleString("en-GB")} this week
          </span>
        </div>
      )}
    </section>
  );
}
