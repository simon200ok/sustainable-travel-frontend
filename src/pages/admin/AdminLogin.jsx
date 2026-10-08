import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { adminEnrol, adminLogin } from '../../lib/adminApi';

function groupSecret(secret) {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

export default function AdminLogin({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null);
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!setup) return;
    QRCode.toDataURL(setup.otpauthUri, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [setup]);

  async function signIn(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await adminLogin(email.trim(), password, code.trim());
      setPassword('');
      setCode('');
      if (result.mfaSetupRequired) setSetup(result);
      else onSignedIn(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function finishSetup(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await adminEnrol(setup.setupToken, code.trim());
      setSetup(null);
      onSignedIn(result);
    } catch (err) {
      setError(err.message);
      if (err.status === 401) setSetup(null);
    } finally {
      setBusy(false);
      setCode('');
    }
  }

  const codeInput = (
    <input
      id="admin-code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      placeholder="123456"
    />
  );

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <span className="admin-badge">Admin</span>
        {!setup ? (
          <>
            <h1>Sign in</h1>
            <p className="admin-muted">For the app's admin team only. Every sign-in is recorded.</p>
            <form onSubmit={signIn} className="admin-form">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
              <label htmlFor="admin-code">6-digit code from your authenticator app</label>
              {codeInput}
              <p className="admin-hint">First time signing in? Leave the code empty — you'll set up your authenticator app next.</p>
              {error && <p className="admin-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner" /> : null} Sign in
              </button>
            </form>
            <p className="admin-hint">After 5 failed attempts the account is locked for 15 minutes.</p>
          </>
        ) : (
          <>
            <h1>Set up two-factor sign-in</h1>
            <ol className="admin-steps">
              <li>Open an authenticator app on your phone (Microsoft Authenticator, Google Authenticator, or similar).</li>
              <li>Scan this QR code, or choose “enter a setup key” and type the key below.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            {qr && <img className="admin-qr" src={qr} alt="QR code for your authenticator app" width="220" height="220" />}
            <p className="admin-secret">
              Setup key: <code>{groupSecret(setup.secret)}</code>
            </p>
            <form onSubmit={finishSetup} className="admin-form">
              <label htmlFor="admin-code">6-digit code</label>
              {codeInput}
              {error && <p className="admin-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>
                {busy ? <span className="spinner" /> : null} Turn on two-factor and sign in
              </button>
            </form>
            <p className="admin-hint">This set-up screen expires after 10 minutes. Keep the setup key private.</p>
          </>
        )}
      </div>
    </div>
  );
}
