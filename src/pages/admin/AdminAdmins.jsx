import { useCallback, useEffect, useState } from 'react';
import { adminAction, deleteAdmin, inviteAdmin, listAdmins, revokeInvite } from '../../lib/adminApi';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const fmt = (iso) => (iso ? dateTime.format(new Date(iso)) : 'never');

export default function AdminAdmins() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    listAdmins().then(setData).catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  async function act(admin, action, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      const res = await adminAction(admin.id, action);
      setNotice(res.message);
      load();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function remove(admin) {
    const typed = window.prompt(`Type ${admin.email} to permanently delete this admin account.`);
    if (typed?.trim().toLowerCase() !== admin.email) return;
    try {
      await deleteAdmin(admin.id);
      setNotice(`${admin.email} was deleted.`);
      load();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setInviteLink(null);
    setCopied(false);
    try {
      const res = await inviteAdmin(invite.email.trim(), invite.name.trim());
      setInviteLink(res);
      setInvite({ name: '', email: '' });
      load();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink.inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!data) return <p className="admin-muted"><span className="spinner" /> Loading admins…</p>;

  return (
    <div className="admin-admins">
      {notice && <p className="admin-success" role="status">{notice}</p>}

      <section className="admin-panel admin-panel-wide">
        <h2>Admin accounts</h2>
        <p className="admin-muted">
          {data.usableAdmins} admin{data.usableAdmins === 1 ? '' : 's'} can sign in right now. The app never allows the
          last one to be disabled or deleted — keep at least two, so access isn't lost if someone leaves or loses their phone.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Last sign-in</th><th /></tr></thead>
            <tbody>
              {data.admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}{a.isYou && <span className="admin-tag">You</span>}</td>
                  <td>{a.email}</td>
                  <td>
                    {!a.active ? <span className="admin-status admin-status-spam">Disabled</span>
                      : a.locked ? <span className="admin-status admin-status-new">Locked</span>
                      : a.mfaEnabled ? <span className="admin-status admin-status-resolved">Active</span>
                      : <span className="admin-status">Two-factor not set up</span>}
                  </td>
                  <td>{fmt(a.lastLoginAt)}</td>
                  <td className="admin-row-actions">
                    {!a.isYou && (
                      <>
                        {a.locked && <button type="button" className="btn btn-ghost" onClick={() => act(a, 'unlock')}>Unlock</button>}
                        {a.active ? (
                          <button type="button" className="btn btn-ghost" onClick={() => act(a, 'disable', `Stop ${a.email} signing in?`)}>Disable</button>
                        ) : (
                          <button type="button" className="btn btn-ghost" onClick={() => act(a, 'enable')}>Enable</button>
                        )}
                        {a.mfaEnabled && (
                          <button type="button" className="btn btn-ghost" onClick={() => act(a, 'reset-mfa', `Reset two-factor for ${a.email}? Use this if they lost their phone.`)}>
                            Reset two-factor
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost admin-danger" onClick={() => remove(a)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-panels">
        <section className="admin-panel">
          <h2>Invite an admin</h2>
          <form className="admin-form" onSubmit={sendInvite}>
            <label htmlFor="inv-name">Their name</label>
            <input id="inv-name" required maxLength={100} value={invite.name} onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))} />
            <label htmlFor="inv-email">Their email</label>
            <input id="inv-email" type="email" required maxLength={254} value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} />
            <button type="submit" className="btn btn-primary">Create invite link</button>
          </form>
          {inviteLink && (
            <div className="notice notice-success admin-invite-link">
              <div>
                <strong>Invite link ready</strong>
                Send it privately (for example in a Teams message). It works once and expires {fmt(inviteLink.expiresAt)}.
                <code>{inviteLink.inviteUrl}</code>
                <div className="notice-actions">
                  <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <h2>Pending invites</h2>
          {data.invites.length === 0 ? (
            <p className="admin-muted">No invites waiting.</p>
          ) : (
            <ul className="admin-invite-list">
              {data.invites.map((i) => (
                <li key={i.id}>
                  <span><strong>{i.name}</strong> · {i.email}<br /><small className="admin-muted">Expires {fmt(i.expiresAt)}</small></span>
                  <button type="button" className="btn btn-ghost admin-danger" onClick={async () => { await revokeInvite(i.id).catch((err) => setNotice(err.message)); load(); }}>
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h3 className="admin-subheading">How admin access is protected</h3>
          <ul className="admin-muted admin-bullets">
            <li>There's no public sign-up. New admins need an invite from a signed-in admin, or the system owner's command-line tool.</li>
            <li>Invite links work once, expire after 72 hours, and only a scrambled copy is stored.</li>
            <li>Every admin must set up two-factor before they can do anything.</li>
            <li>Invites, new accounts, deletions and lockouts trigger a security email.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
