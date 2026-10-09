import { useEffect, useState } from 'react';
import { getUsage } from '../../lib/adminApi';

const PAGE_NAMES = {
  '/': 'Home (journey planner)',
  '/ticketing': 'Ticketing',
  '/zones': 'Zones',
  '/map': 'Live Map',
  '/sustainability': 'Sustainability',
  '/contact': 'Contact',
  '/privacy': 'Privacy',
  '/accessibility': 'Accessibility',
  other: 'Other pages',
};
const n = (v) => v.toLocaleString('en-GB');
const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const monthName = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

function Bars({ items, label, valueKey = 'users' }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <div className="usage-bars" aria-hidden="true">
      {items.map((item) => (
        <span key={item.key} className="usage-bar" title={`${item.label}: ${n(item[valueKey])} ${label}`}>
          <span style={{ height: `${(item[valueKey] / max) * 100}%` }} />
        </span>
      ))}
    </div>
  );
}

// Anonymous visitor totals (see the Privacy page for how they're counted)
export default function AdminUsage() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsage().then(setUsage).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="admin-error" role="alert">Visitor numbers: {error}</p>;
  if (!usage) return <p className="admin-muted"><span className="spinner" /> Loading visitor numbers…</p>;

  const daily = usage.daily.map((d) => ({ ...d, key: d.day, label: shortDay.format(new Date(d.day)) }));
  const monthly = usage.monthly.map((m) => ({ ...m, key: m.month, label: monthName.format(new Date(`${m.month}-01`)) }));
  const thirtyDayViews = usage.daily.reduce((sum, d) => sum + d.views, 0);

  return (
    <section className="admin-usage" aria-labelledby="usage-heading">
      <h2 id="usage-heading">Visitors</h2>
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <span className="admin-stat-value">{n(usage.totalUsers)}</span>
          <span className="admin-stat-label">people have used the app (all time)</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{n(usage.today.users)}</span>
          <span className="admin-stat-label">visitors today ({n(usage.today.newUsers)} new)</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{n(usage.thisWeek.users)}</span>
          <span className="admin-stat-label">visitors this week</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{n(usage.thisMonth.users)}</span>
          <span className="admin-stat-label">visitors this month ({n(usage.thisMonth.installed)} using the installed app)</span>
        </div>
      </div>

      <div className="admin-panels">
        <section className="admin-panel">
          <h3>Visitors per day — last 30 days</h3>
          <Bars items={daily} label="visitors" />
          <p className="admin-muted">{n(thirtyDayViews)} page views in the last 30 days.</p>
          <details className="usage-details">
            <summary>Show as a table</summary>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Day</th><th>Visitors</th><th>New</th><th>Page views</th></tr></thead>
                <tbody>
                  {[...daily].reverse().map((d) => (
                    <tr key={d.key}><td>{d.label}</td><td>{n(d.users)}</td><td>{n(d.newUsers)}</td><td>{n(d.views)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="admin-panel">
          <h3>Visitors per month</h3>
          <Bars items={monthly} label="visitors" />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Month</th><th>Visitors</th><th>Installed app</th></tr></thead>
              <tbody>
                {[...monthly].reverse().filter((m) => m.users).slice(0, 6).map((m) => (
                  <tr key={m.key}><td>{m.label}</td><td>{n(m.users)}</td><td>{n(m.installed)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <h3>Most visited pages — last 30 days</h3>
          {usage.pages.length === 0 ? (
            <p className="admin-muted">No visits recorded yet.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Page</th><th>Views</th></tr></thead>
              <tbody>
                {usage.pages.map((p) => (
                  <tr key={p.path}><td>{PAGE_NAMES[p.path] || p.path}</td><td>{n(p.views)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="admin-muted">
            Counted anonymously: no cookies, IDs or IP addresses. People who opt out on the Privacy page, or whose
            browser sends a Global Privacy Control signal, aren't counted, so real numbers are a little higher.
          </p>
        </section>
      </div>
    </section>
  );
}
