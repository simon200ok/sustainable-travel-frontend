import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { acceptInvite } from '../../lib/adminApi';

const readToken = () => window.location.hash.replace(/^#/, '');

export default function AcceptInvite() {
  const [token] = useState(readToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState({ busy: false, error: '', done: '' });

  // Remove the token from the address bar and browser history straight away
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setState({ busy: false, error: "The passwords don't match.", done: '' });
      return;
    }
    setState({ busy: true, error: '', done: '' });
    try {
      const res = await acceptInvite(token, password);
      setPassword('');
      setConfirm('');
      setState({ busy: false, error: '', done: `${res.message} Your sign-in email is ${res.email}.` });
    } catch (err) {
      setState({ busy: false, error: err.message, done: '' });
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <span className="admin-badge">Admin</span>
        <h1>Accept your invite</h1>
        {!token ? (
          <p className="admin-error">This invite link is incomplete. Open the full link you were sent, or ask for a new one.</p>
        ) : state.done ? (
          <>
            <p className="admin-success" role="status">{state.done}</p>
            <Link to="/admin" className="btn btn-primary">Sign in and set up two-factor</Link>
          </>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            <p className="admin-muted">Choose a password for your admin account. Next you'll set up an authenticator app.</p>
            <label htmlFor="inv-pw">New password</label>
            <input id="inv-pw" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
            <label htmlFor="inv-pw2">Repeat password</label>
            <input id="inv-pw2" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <p className="admin-hint">At least 12 characters. A short phrase of 3–4 random words works well.</p>
            {state.error && <p className="admin-error" role="alert">{state.error}</p>}
            <button type="submit" className="btn btn-primary" disabled={state.busy}>
              {state.busy ? <span className="spinner" /> : null} Create my admin account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
