import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLocations, getZones } from '../../../lib/api';
import { createLocation, deleteLocation, updateLocation } from '../../../lib/adminApi';

const TYPES = [
  { value: 'cycle_park', label: 'Cycle parking' },
  { value: 'campus', label: 'Campus' },
  { value: 'metro', label: 'Metro station' },
  { value: 'train', label: 'Train station' },
  { value: 'bus', label: 'Bus station' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const NEW = { name: '', type: 'cycle_park', lat: 54.9044, lng: -1.3918, description: '', nearby: '', zone_id: '' };

const pin = L.divIcon({
  className: 'custom-marker',
  html: '<div class="admin-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

function Recentre({ position }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position);
  }, [map, position]);
  return null;
}

function LocationForm({ initial, zones, onSaved, onCancel, onDeleted }) {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState('');
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));
  const position = useMemo(() => [Number(form.lat), Number(form.lng)], [form.lat, form.lng]);
  const place = ({ lat, lng }) => setForm((v) => ({ ...v, lat: lat.toFixed(6), lng: lng.toFixed(6) }));

  async function save(e) {
    e.preventDefault();
    setState('Saving…');
    const body = {
      name: form.name,
      type: form.type,
      lat: Number(form.lat),
      lng: Number(form.lng),
      description: form.description,
      nearby_transport: form.nearby.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      const saved = form.id
        ? await updateLocation(form.id, { ...body, zone_id: form.zone_id ? Number(form.zone_id) : 0 })
        : await createLocation({ ...body, zone_id: form.zone_id ? Number(form.zone_id) : null });
      onSaved(saved);
    } catch (err) {
      setState(err.message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${form.name}” from the map?`)) return;
    try {
      await deleteLocation(form.id);
      onDeleted(form.id);
    } catch (err) {
      setState(err.message);
    }
  }

  return (
    <form className="admin-panel admin-location-form" onSubmit={save}>
      <h2>{form.id ? `Edit: ${initial.name}` : 'Add a location'}</h2>
      <div className="admin-location-grid">
        <div className="admin-form">
          <label htmlFor="loc-name">Name</label>
          <input id="loc-name" required minLength={2} maxLength={120} value={form.name} onChange={set('name')} />
          <label htmlFor="loc-type">Type</label>
          <select id="loc-type" value={form.type} onChange={set('type')}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label htmlFor="loc-zone">Zone</label>
          <select id="loc-zone" value={form.zone_id} onChange={set('zone_id')}>
            <option value="">None (e.g. London)</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <label htmlFor="loc-desc">Description (e.g. “12 covered stands”)</label>
          <textarea id="loc-desc" className="admin-note" rows={3} maxLength={300} value={form.description} onChange={set('description')} />
          <label htmlFor="loc-nearby">Nearby (one per line)</label>
          <textarea id="loc-nearby" className="admin-note" rows={3} value={form.nearby} onChange={set('nearby')} />
          <div className="admin-coords">
            <label>Latitude<input required type="number" step="0.000001" min="49.8" max="60.95" value={form.lat} onChange={set('lat')} /></label>
            <label>Longitude<input required type="number" step="0.000001" min="-8.7" max="1.8" value={form.lng} onChange={set('lng')} /></label>
          </div>
        </div>
        <div>
          <p className="admin-hint">Click the map (or drag the pin) to set the exact position.</p>
          <div className="admin-mini-map">
            <MapContainer center={position} zoom={17} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickToPlace onPick={place} />
              <Recentre position={position} />
              <Marker position={position} icon={pin} draggable eventHandlers={{ dragend: (e) => place(e.target.getLatLng()) }} />
            </MapContainer>
          </div>
        </div>
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn btn-primary">{form.id ? 'Save changes' : 'Add to map'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        {form.id && <button type="button" className="btn btn-ghost admin-danger" onClick={remove}>Delete</button>}
        {state && <span className="admin-error" role="alert">{state}</span>}
      </div>
    </form>
  );
}

export default function AdminLocations() {
  const [locations, setLocations] = useState(null);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('cycle_park');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([getLocations(), getZones()])
      .then(([locs, zs]) => {
        setLocations(locs);
        setZones(zs);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!locations) return <p className="admin-muted"><span className="spinner" /> Loading locations…</p>;

  const shown = locations.filter((l) => filter === 'all' || l.type === filter);
  const edit = (loc) =>
    setEditing({ ...loc, description: loc.description || '', nearby: (loc.nearby_transport || []).join('\n'), zone_id: loc.zone_id ?? '' });

  if (editing) {
    return (
      <LocationForm
        key={editing.id || 'new'}
        initial={editing}
        zones={zones}
        onCancel={() => setEditing(null)}
        onSaved={(saved) => {
          setLocations((all) => (all.some((l) => l.id === saved.id) ? all.map((l) => (l.id === saved.id ? saved : l)) : [...all, saved]));
          setNotice(`Saved “${saved.name}”.`);
          setEditing(null);
        }}
        onDeleted={(id) => {
          setLocations((all) => all.filter((l) => l.id !== id));
          setNotice('Location deleted.');
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="admin-panel admin-panel-wide">
      <div className="admin-toolbar">
        <div className="admin-filters" role="group" aria-label="Location type">
          {[{ value: 'all', label: 'All' }, ...TYPES].map((t) => (
            <button key={t.value} type="button" className={`filter-chip ${filter === t.value ? 'active' : ''}`} aria-pressed={filter === t.value} onClick={() => setFilter(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...NEW, type: filter === 'all' ? 'cycle_park' : filter })}>
          + Add location
        </button>
      </div>
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Type</th><th>Description</th><th /></tr></thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{TYPE_LABEL[l.type] || l.type}</td>
                <td className="admin-muted">{l.description}</td>
                <td><button type="button" className="btn btn-ghost" onClick={() => edit(l)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
