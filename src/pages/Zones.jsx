import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { readableTextOn } from '../lib/colour';
import { getZones } from '../lib/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { zonePricing } from '../data/travelData';

import './Zones.css';

// Titles follow the Nexus Metro and local rail fare zone map
const zoneMeta = {
  'Zone A': {
    label: 'Newcastle & Gateshead city centres',
    highlight: false,
  },
  'Zone B': {
    label: 'Inner Tyneside',
    highlight: false,
  },
  'Zone C': {
    label: 'Sunderland, the Coast & Airport',
    highlight: true,
  },
  'Zone D': {
    label: 'South East Northumberland',
    highlight: false,
  },
};

export default function Zones() {
  const { data, loading, error } = useAsyncData(getZones, []);

  const zones = useMemo(() => {
    // Always show Zone A, B, C, D in order, whatever order the server returns them in
    return [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((zone) => {
      const meta = zoneMeta[zone.name] || {
        label: zone.name,
        highlight: false,
      };

      return {
        id: zone.id,
        name: zone.name,
        label: meta.label,
        color: zone.color,
        areas: zone.areas ?? [],
        metroStations: zone.metro_stations ?? [],
        highlight: meta.highlight,
      };
    });
  }, [data]);

  return (
    <div className="page zones">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Travel Zones</h1>
          <p className="page-desc">
            Metro and Northumberland Line fares are based on four zones, A to D. Both University of
            Sunderland campuses are in Zone C. Knowing your zones helps you pick the right ticket and avoid overpaying.
          </p>
        </div>
      </section>

      <section className="section zones-content">
        <div className="container">
          {loading && (
            <p className="page-loading" role="status">Loading zones...</p>
          )}

          {error && (
            <p className="page-error" role="alert">Failed to load zones: {error}</p>
          )}

          {!loading && !error && (
            <>
              <div className="zones-grid">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`zone-card ${zone.highlight ? 'zone-highlight' : ''}`}
                  >
                    <div className="zone-card-header">
                      <div className="zone-badge" style={{ background: zone.color, color: readableTextOn(zone.color) }}>
                        {zone.name}
                      </div>
                      <h3>{zone.label}</h3>
                      {zone.highlight && (
                        <span className="zone-campus-tag">Your Campus Zone</span>
                      )}
                    </div>

                    <div className="zone-card-body">
                      <div className="zone-info-group">
                        <h4>Areas Covered</h4>
                        <div className="zone-tags">
                          {zone.areas.map((area) => (
                            <span key={area} className="zone-tag">{area}</span>
                          ))}
                        </div>
                      </div>

                      <div className="zone-info-group">
                        <h4>Stations</h4>
                        <div className="zone-tags">
                          {zone.metroStations.map((station) => (
                            <span key={station} className="zone-tag zone-tag-station">
                              {station}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="zone-pricing-section">
                <h2 className="section-title">Metro Zone Pricing</h2>
                <p className="section-subtitle">
                  Paper ticket prices depend on how many zones you travel through. With Pop Pay As You Go, any
                  single journey costs at most £2.50 and a whole day at most £5.00. Nexus fares from 1 April 2026.
                </p>

                <div className="zone-pricing-table-wrapper">
                  <table className="zone-pricing-table">
                    <thead>
                      <tr>
                        <th>Zones</th>
                        <th>Single (paper)</th>
                        <th>Day ticket (paper)</th>
                        <th>Pop Pay As You Go</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zonePricing.map((row, i) => (
                        <tr key={i}>
                          <td className="zone-label-cell">{row.zones}</td>
                          <td>{row.single}</td>
                          <td>{row.day}</td>
                          <td>{row.pop}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="zone-source">
                Zones from the Nexus Metro and local rail fare zone map. Stations on a boundary count as either zone
                and are shown in both, e.g. “Felling (A/B)”.{' '}
                <a href="https://www.nexus.org.uk/metro/metro-maps" target="_blank" rel="noopener noreferrer">
                  See the official zone map
                </a>
              </p>

              <Link to="/contact?topic=travel-info" className="report-link zone-report">
                🚩 Spotted something wrong with a zone or station? Tell us
              </Link>

              <div className="zone-tips">
                <div className="zone-tip-card">
                  <span className="zone-tip-icon">🎓</span>
                  <h3>Student Zone Tip</h3>
                  <p>
                    Trips around Sunderland, including between City Campus and St Peter's, stay in <strong>Zone C</strong>.
                    From Newcastle city centre (Zone A) you pass through Zone B, so you need an all-zones ticket —
                    or tap with Pop Pay As You Go and pay no more than £2.50. If you're 21 or under, it's £1.
                  </p>
                </div>
                <div className="zone-tip-card">
                  <span className="zone-tip-icon">🔄</span>
                  <h3>Multi-Operator Passes</h3>
                  <p>
                    The <strong>Transport North East Day Saver</strong> (£7.50) covers buses, Metro, the Shields Ferry
                    and local rail across Tyne and Wear, Northumberland and County Durham — great value if you mix transport.
                  </p>
                </div>
                <div className="zone-tip-card">
                  <span className="zone-tip-icon">📱</span>
                  <h3>Pop Card</h3>
                  <p>
                    Tap in and out with a <strong>Pop Pay As You Go</strong> card on the Metro and the Northumberland Line.
                    Fares are capped automatically at £2.50 a journey and £5.00 a day.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
