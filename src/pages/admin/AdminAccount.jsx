import { useState } from 'react';
import { changeAdminPassword, clearSession } from '../../lib/adminApi';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminAccount({ admin, onSignOut }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '', code: '' });
  const [status, setStatus] = useState({ busy: false, error: '', done: '' });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: field === 'code' ? e.target.value.replace(/\D/g, '') : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ busy: false, error: "The new passwords don't match.", done: '' });
      return;
    }
    setStatus({ busy: true, error: '', done: '' });
    try {
      const res = await changeAdminPassword(form.current, form.next, form.code);
      setForm({ current: '', next: '', confirm: '', code: '' });
      setStatus({ busy: false, error: '', done: res.message });
      // The server has signed this account out everywhere
      setTimeout(clearSession, 2500);
    } catch (err) {
      setStatus({ busy: false, error: err.message, done: '' });
    }
  }

  return (
    <div className="admin-panels">
      <section className="admin-panel">
        <h2>My account</h2>
        <dl className="admin-meta">
          <dt>Name</dt><dd>{admin.name}</dd>
          <dt>Email</dt><dd>{admin.email}</dd>
          <dt>Last sign-in</dt><dd>{admin.lastLoginAt ? dateTime.format(new Date(admin.lastLoginAt)) : '—'}</dd>
          <dt>Two-factor</dt><dd>On ✓</dd>
        </dl>
        <p className="admin-muted">
          Signing out ends your session on every device. If you think someone else knows your password, change it below and
          ask the system owner to reset your two-factor set-up.
        </p>
        <button type="button" className="btn btn-ghost" onClick={onSignOut}>Sign out everywhere</button>
      </section>

      <section className="admin-panel">
        <h2>Change password</h2>
        <form className="admin-form" onSubmit={submit}>
          <label htmlFor="pw-current">Current password</label>
          <input id="pw-current" type="password" autoComplete="current-password" required maxLength={72} value={form.current} onChange={set('current')} />
          <label htmlFor="pw-new">New password</label>
          <input id="pw-new" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={form.next} onChange={set('next')} />
          <label htmlFor="pw-confirm">Repeat new password</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={form.confirm} onChange={set('confirm')} />
          <label htmlFor="pw-code">6-digit code from your authenticator app</label>
          <input id="pw-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={form.code} onChange={set('code')} />
          <p className="admin-hint">At least 12 characters. A short phrase of 3–4 random words works well.</p>
          {status.error && <p className="admin-error" role="alert">{status.error}</p>}
          {status.done && <p className="admin-success" role="status">{status.done}</p>}
          <button type="submit" className="btn btn-primary" disabled={status.busy}>
            {status.busy ? <span className="spinner" /> : null} Change password
          </button>
        </form>
      </section>
    </div>
  );
}
