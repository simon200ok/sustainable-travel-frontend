import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, syncFaresNow } from '../../lib/adminApi';
import { MODE_META, formatKg } from '../../lib/format';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const fmt = (iso) => (iso ? dateTime.format(new Date(iso)) : '—');

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [sync, setSync] = useState({ busy: false, message: '' });

  const load = useCallback(() => {
    getAdminStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  async function runSync() {
    setSync({ busy: true, message: '' });
    try {
      const counts = await syncFaresNow();
      setSync({ busy: false, message: `Fares updated: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'no changes'}` });
      load();
    } catch (err) {
      setSync({ busy: false, message: err.message });
    }
  }

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!stats) return <p className="admin-muted"><span className="spinner" /> Loading dashboard…</p>;

  const google = stats.google;
  const googlePct = Math.min(100, Math.round((google.callsToday / google.dailyCap) * 100));

  return (
    <div className="admin-dashboard">
      <div className="admin-stat-grid">
        <Link to="/admin/messages" className="admin-stat admin-stat-link">
          <span className="admin-stat-value">{stats.messages.new}</span>
          <span className="admin-stat-label">new messages</span>
        </Link>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.messages.lastSevenDays}</span>
          <span className="admin-stat-label">messages in the last 7 days</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatKg(stats.impact.term.co2SavedKg)}</span>
          <span className="admin-stat-label">CO₂ saved this term ({stats.impact.term.journeys} trips)</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatKg(stats.impact.week.co2SavedKg)}</span>
          <span className="admin-stat-label">CO₂ saved in the last 7 days</span>
        </div>
      </div>

      <div className="admin-panels">
        <section className="admin-panel">
          <h2>Green trips this term by mode</h2>
          {Object.keys(stats.impact.term.byMode).length === 0 ? (
            <p className="admin-muted">No completed trips yet this term.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Mode</th><th>Trips</th><th>CO₂ saved</th></tr></thead>
              <tbody>
                {Object.entries(stats.impact.term.byMode).map(([mode, v]) => (
                  <tr key={mode}>
                    <td>{MODE_META[mode]?.icon} {mode.replace('_', ' ')}</td>
                    <td>{v.journeys}</td>
                    <td>{formatKg(v.co2SavedKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-panel">
          <h2>Bus fares (daily sync)</h2>
          {stats.fares.length === 0 ? (
            <p className="admin-muted">No fares synced yet.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Operator</th><th>Tickets</th><th>Last checked</th></tr></thead>
              <tbody>
                {stats.fares.map((f) => (
                  <tr key={f.operator}>
                    <td>{f.operator}</td>
                    <td>{f.products}</td>
                    <td>{fmt(f.syncedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button type="button" className="btn btn-ghost" onClick={runSync} disabled={sync.busy}>
            {sync.busy ? <span className="spinner" /> : '🔄'} {sync.busy ? 'Syncing (about 20 seconds)…' : 'Sync fares now'}
          </button>
          {sync.message && <p className="admin-muted" role="status">{sync.message}</p>}
        </section>

        <section className="admin-panel">
          <h2>Services</h2>
          <p className="admin-label">Google calls today</p>
          <div className="admin-meter" role="meter" aria-valuemin={0} aria-valuemax={google.dailyCap} aria-valuenow={google.callsToday}>
            <span style={{ width: `${googlePct}%` }} className={googlePct > 80 ? 'warn' : ''} />
          </div>
          <p className="admin-muted">{google.callsToday.toLocaleString('en-GB')} of {google.dailyCap.toLocaleString('en-GB')} daily cap ({googlePct}%)</p>
          <p className="admin-label">Live 700/701 feed</p>
          <p className="admin-muted">
            {stats.liveBuses.lastFetchSecondsAgo == null
              ? 'Not requested since the server started.'
              : `Last fetched ${stats.liveBuses.lastFetchSecondsAgo}s ago · ${stats.liveBuses.vehicles} bus(es) live`}
          </p>
          <p className="admin-label">Map locations</p>
          <p className="admin-muted">
            {Object.entries(stats.locations).map(([type, n]) => `${type.replace('_', ' ')}: ${n}`).join(' · ')}
          </p>
        </section>
      </div>
    </div>
  );
}
