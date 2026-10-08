import { useEffect, useState } from 'react';
import { getAuditLog } from '../../lib/adminApi';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium' });

const ACTION_LABEL = {
  login: 'Signed in',
  login_failed: 'Failed sign-in',
  login_blocked_locked: 'Sign-in blocked (locked)',
  logout: 'Signed out',
  mfa_setup_started: 'Started two-factor set-up',
  mfa_enabled: 'Turned on two-factor',
  password_changed: 'Changed password',
  password_change_failed: 'Failed password change',
  message_updated: 'Updated message',
  message_deleted: 'Deleted message',
  messages_erased: 'Erased messages (data request)',
  fares_synced: 'Synced fares',
};

export default function AdminAudit() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAuditLog(page)
      .then((r) => !cancelled && setResult(r))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!result) return <p className="admin-muted"><span className="spinner" /> Loading…</p>;

  const pages = Math.max(1, Math.ceil(result.total / 50));

  return (
    <section className="admin-panel">
      <h2>Activity log</h2>
      <p className="admin-muted">Every admin sign-in, failed attempt and change. Entries are kept for 12 months.</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>When</th><th>Admin</th><th>What</th><th>Details</th></tr>
          </thead>
          <tbody>
            {result.items.map((e) => (
              <tr key={e.id} className={e.action.includes('failed') || e.action.includes('blocked') ? 'admin-row-warn' : ''}>
                <td>{dateTime.format(new Date(e.at))}</td>
                <td>{e.admin || '—'}</td>
                <td>{ACTION_LABEL[e.action] || e.action}</td>
                <td>{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="admin-pager">
          <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>◀</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>▶</button>
        </div>
      )}
    </section>
  );
}
