import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveBuses, getLocations } from '../lib/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './TravelMap.css';

const SUNDERLAND_CENTER = [54.9069, -1.3838];
const LONDON_CENTER = [51.5001, -0.0145];
const DEFAULT_ZOOM = 14;
const BUS_POLL_MS = 15_000;

const iconColors = {
  campus: '#F57C00',
  metro: '#FFD700',
  train: '#0D1B3E',
  bus: '#00A651',
  cycle_park: '#00897B',
};

const iconLabels = {
  campus: '🎓',
  metro: '🚇',
  train: '🚂',
  bus: '🚌',
  cycle_park: '🚲',
};

const legendItems = [
  { type: 'campus', label: 'UoS Campus' },
  { type: 'cycle_park', label: 'Cycle Parking' },
  { type: 'metro', label: 'Metro Station' },
  { type: 'train', label: 'Train Station' },
  { type: 'bus', label: 'Bus Station' },
  { type: 'live', label: 'Live 700/701 bus' },
];

function createIcon(type) {
  const color = iconColors[type] || '#F57C00';
  const size = type === 'cycle_park' ? 28 : 36;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="map-marker" style="background:${color};width:${size}px;height:${size}px;font-size:${size / 2}px">${iconLabels[type] || '📍'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

function createBusIcon(bus) {
  // Route numbers come from a fixed allow-list (700/701) on the server; bearing is numeric
  const route = String(bus.route).replace(/[^0-9A-Za-z]/g, '');
  const rotation = Number.isFinite(bus.bearing) ? bus.bearing : null;
  return L.divIcon({
    className: 'custom-marker live-bus-marker',
    html: `<div class="live-bus">${
      rotation !== null ? `<span class="live-bus-arrow" style="transform:rotate(${rotation}deg)"></span>` : ''
    }<span class="live-bus-route">${route}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

function secondsAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, DEFAULT_ZOOM, { duration: 1.2 });
  }, [map, target]);
  return null;
}

function useLiveBuses(enabled) {
  const online = useOnlineStatus();
  const [buses, setBuses] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', updatedAt: null });

  useEffect(() => {
    if (!enabled || !online) return undefined;
    let timer;
    let cancelled = false;

    async function poll() {
      // Don't poll while the tab is hidden: saves the user's data and our API quota
      if (document.visibilityState === 'visible') {
        try {
          const data = await getLiveBuses();
          if (cancelled) return;
          setBuses(data);
          setStatus({ loading: false, error: '', updatedAt: new Date() });
        } catch (err) {
          if (!cancelled) setStatus((s) => ({ ...s, loading: false, error: err.message }));
        }
      }
      if (!cancelled) timer = setTimeout(poll, BUS_POLL_MS);
    }

    poll();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, online]);

  return { buses, status, online };
}

export default function TravelMap() {
  const { data: locations, loading, error } = useAsyncData(getLocations, []);
  const [hidden, setHidden] = useState(() => new Set());
  const [flyTarget, setFlyTarget] = useState(null);
  const showLive = !hidden.has('live');
  const { buses, status, online } = useLiveBuses(showLive);

  const markers = useMemo(
    () =>
      locations
        .filter((loc) => !hidden.has(loc.type))
        .map((loc) => ({ ...loc, icon: createIcon(loc.type) })),
    [locations, hidden],
  );

  const toggle = (type) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  if (loading) {
    return <div className="page-loading">Loading map locations...</div>;
  }

  if (error) {
    return <div className="page-error">Failed to load map data: {error}</div>;
  }

  const campuses = locations.filter((loc) => loc.type === 'campus');

  return (
    <div className="page travel-map">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Live Map</h1>
          <p className="page-desc">
            Campuses, cycle parking and transport links — with the 700 and 701 university buses moving live.
          </p>
        </div>
      </section>

      <section className="section map-content">
        <div className="container">
          <div className="map-toolbar">
            <div className="map-legend" role="group" aria-label="Show or hide on the map">
              {legendItems.map((item) => {
                const on = !hidden.has(item.type);
                return (
                  <button
                    key={item.type}
                    type="button"
                    className={`legend-item ${on ? '' : 'legend-off'}`}
                    aria-pressed={on}
                    onClick={() => toggle(item.type)}
                  >
                    <span
                      className={`legend-dot ${item.type === 'live' ? 'legend-dot-live' : ''}`}
                      style={item.type === 'live' ? undefined : { background: iconColors[item.type] }}
                      aria-hidden="true"
                    >
                      {item.type === 'live' ? '7xx' : iconLabels[item.type]}
                    </span>
                    <span className="legend-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="campus-switch" role="group" aria-label="Jump to campus">
              <button type="button" onClick={() => setFlyTarget([...SUNDERLAND_CENTER])}>Sunderland</button>
              <button type="button" onClick={() => setFlyTarget([...LONDON_CENTER])}>London</button>
            </div>
          </div>

          {showLive && (
            <p className={`live-status ${status.error ? 'live-status-error' : ''}`} role="status" aria-live="polite">
              {!online
                ? '📴 Live buses paused — you are offline.'
                : status.loading
                  ? 'Loading live buses…'
                  : status.error
                    ? `⚠️ ${status.error}`
                    : buses.length
                      ? `🟢 ${buses.length} bus${buses.length === 1 ? '' : 'es'} live on routes 700/701 · updated ${status.updatedAt.toLocaleTimeString('en-GB')}`
                      : '⏸️ No 700/701 buses are running right now. They appear here automatically when in service.'}
            </p>
          )}

          <div className="map-wrapper">
            <MapContainer
              center={SUNDERLAND_CENTER}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              className="travel-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Bus data: <a href="https://www.bus-data.dft.gov.uk/">BODS</a> (OGL v3.0)'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo target={flyTarget} />
              {markers.map((loc) => (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={loc.icon}>
                  <Popup>
                    <div className="map-popup">
                      <h3>{loc.name}</h3>
                      <p>{loc.description}</p>
                      {loc.nearby_transport?.length > 0 && (
                        <div className="popup-transport">
                          <strong>Nearby:</strong>
                          <ul>
                            {loc.nearby_transport.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {showLive &&
                buses.map((bus) => (
                  <Marker
                    key={bus.vehicleRef || `${bus.route}-${bus.lat}`}
                    position={[bus.lat, bus.lng]}
                    icon={createBusIcon(bus)}
                    zIndexOffset={1000}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h3>Bus {bus.route}</h3>
                        <p>
                          {bus.origin && bus.destination ? `${bus.origin} → ${bus.destination}` : 'University bus'}
                          <br />
                          Position updated {secondsAgo(bus.recordedAt)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          <div className="map-locations-grid">
            {campuses.map((loc) => (
              <div key={loc.id} className="map-location-card">
                <div className="map-location-icon" style={{ background: iconColors[loc.type] }} aria-hidden="true">
                  {iconLabels[loc.type]}
                </div>
                <div>
                  <h3>{loc.name}</h3>
                  <p>{loc.description}</p>
                  {loc.nearby_transport?.length > 0 && (
                    <ul className="nearby-list">
                      {loc.nearby_transport.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <p className="cycle-count">
                    🚲 {locations.filter((l) => l.type === 'cycle_park' && l.nearby_transport?.includes(loc.name)).length} cycle parking spots mapped nearby
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
