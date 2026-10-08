import { useEffect, useState } from 'react';
import { getContentNotes, updateContentNote } from '../../../lib/adminApi';

const NOTES = {
  metro_fares_note: {
    label: 'Metro fares note (Ticketing page)',
    hint: 'Update this when Nexus changes its fares, e.g. “Nexus fares in effect from 1 April 2027.”',
  },
};

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminNotes() {
  const [notes, setNotes] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [state, setState] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    getContentNotes()
      .then((data) => {
        setNotes(data);
        setDrafts(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.value])));
      })
      .catch((err) => setError(err.message));
  }, []);

  async function save(key) {
    setState((s) => ({ ...s, [key]: 'Saving…' }));
    try {
      const saved = await updateContentNote(key, drafts[key]);
      setNotes((n) => ({ ...n, [key]: saved }));
      setState((s) => ({ ...s, [key]: 'Saved ✓' }));
    } catch (err) {
      setState((s) => ({ ...s, [key]: err.message }));
    }
  }

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!notes) return <p className="admin-muted"><span className="spinner" /> Loading…</p>;

  return (
    <div className="admin-panels">
      {Object.entries(NOTES).map(([key, meta]) => (
        <section key={key} className="admin-panel">
          <h2>{meta.label}</h2>
          <p className="admin-hint">{meta.hint}</p>
          <textarea
            className="admin-note"
            rows={3}
            maxLength={500}
            aria-label={meta.label}
            value={drafts[key] ?? ''}
            onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
          />
          <p className="admin-hint">
            {notes[key]?.updatedAt ? `Last changed ${dateTime.format(new Date(notes[key].updatedAt))}` : 'Showing the default text.'}
          </p>
          <div className="admin-actions">
            <button type="button" className="btn btn-primary" disabled={drafts[key] === notes[key]?.value} onClick={() => save(key)}>
              Save
            </button>
            {state[key] && <span className="admin-muted" role="status">{state[key]}</span>}
          </div>
        </section>
      ))}
    </div>
  );
}
