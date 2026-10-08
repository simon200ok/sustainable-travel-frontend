import { useEffect, useState } from 'react';
import { getZones } from '../../../lib/api';
import { updateZone } from '../../../lib/adminApi';
import { isHardToRead } from '../../../lib/colour';

const toLines = (list) => (list || []).join('\n');
const fromLines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

function ZoneEditor({ zone, onSaved }) {
  const [form, setForm] = useState({
    description: zone.description || '',
    color: zone.color,
    areas: toLines(zone.areas),
    stations: toLines(zone.metro_stations),
  });
  const [state, setState] = useState('');
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setState('Saving…');
    try {
      const saved = await updateZone(zone.id, {
        description: form.description,
        color: form.color,
        areas: fromLines(form.areas),
        metro_stations: fromLines(form.stations),
      });
      onSaved(saved);
      setState('Saved ✓');
    } catch (err) {
      setState(err.message);
    }
  }

  return (
    <form className="admin-panel admin-zone-form" onSubmit={save}>
      <h2><span className="admin-zone-swatch" style={{ background: form.color }} aria-hidden="true" /> {zone.name}</h2>
      <label className="admin-label" htmlFor={`zone-desc-${zone.id}`}>Description</label>
      <textarea id={`zone-desc-${zone.id}`} className="admin-note" rows={2} maxLength={300} value={form.description} onChange={set('description')} />
      <label className="admin-label" htmlFor={`zone-colour-${zone.id}`}>Badge colour</label>
      <input id={`zone-colour-${zone.id}`} type="color" value={form.color} onChange={set('color')} />
      {isHardToRead(form.color) && (
        <p className="admin-error">This colour makes the zone badge hard to read. Choose a darker or lighter shade.</p>
      )}
      <label className="admin-label" htmlFor={`zone-areas-${zone.id}`}>Areas (one per line)</label>
      <textarea id={`zone-areas-${zone.id}`} className="admin-note" rows={5} value={form.areas} onChange={set('areas')} />
      <label className="admin-label" htmlFor={`zone-stations-${zone.id}`}>Stations (one per line — add “(A/B)” for boundary stations)</label>
      <textarea id={`zone-stations-${zone.id}`} className="admin-note" rows={8} value={form.stations} onChange={set('stations')} />
      <div className="admin-actions">
        <button type="submit" className="btn btn-primary">Save {zone.name}</button>
        {state && <span className="admin-muted" role="status">{state}</span>}
      </div>
    </form>
  );
}

export default function AdminZones() {
  const [zones, setZones] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getZones().then(setZones).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!zones) return <p className="admin-muted"><span className="spinner" /> Loading zones…</p>;

  return (
    <div className="admin-panels">
      {zones.map((z) => (
        <ZoneEditor key={z.id} zone={z} onSaved={(saved) => setZones((all) => all.map((x) => (x.id === saved.id ? saved : x)))} />
      ))}
    </div>
  );
}
