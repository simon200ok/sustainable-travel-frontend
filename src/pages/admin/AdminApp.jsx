import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SIGNED_OUT_EVENT, adminLogout, clearSession, getSession, saveSession } from '../../lib/adminApi';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminMessages from './AdminMessages';
import AdminAudit from './AdminAudit';
import AdminAccount from './AdminAccount';
import AdminContent from './AdminContent';
import AdminAdmins from './AdminAdmins';
import AcceptInvite from './AcceptInvite';
import './Admin.css';

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];

function useAdminSession() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const onSignedOut = () => setSession(null);
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  // Sign out when the 30-minute token expires, or after 15 minutes of inactivity
  useEffect(() => {
    if (!session) return undefined;
    let idleTimer;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        adminLogout().catch(() => {});
        clearSession();
      }, IDLE_LIMIT_MS);
    };
    const expiryTimer = setTimeout(clearSession, Math.max(0, session.expiresAt - Date.now()));
    resetIdle();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    return () => {
      clearTimeout(idleTimer);
      clearTimeout(expiryTimer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [session]);

  const signIn = useCallback((result) => setSession(saveSession(result)), []);
  const signOut = useCallback(async () => {
    await adminLogout().catch(() => {});
    clearSession();
  }, []);

  return { session, signIn, signOut };
}

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/admins', label: 'Admins' },
  { to: '/admin/audit', label: 'Activity log' },
  { to: '/admin/account', label: 'My account' },
];

export default function AdminApp() {
  const { session, signIn, signOut } = useAdminSession();
  const { pathname } = useLocation();
  const acceptingInvite = pathname.startsWith('/admin/invite');

  return (
    <div className="page admin">
      {/* React 19 hoists these into <head>: keep the admin area out of search engines */}
      <title>Admin · UoS Sustainable Travel Hub</title>
      <meta name="robots" content="noindex, nofollow" />

      {acceptingInvite ? (
        <AcceptInvite />
      ) : !session ? (
        <AdminLogin onSignedIn={signIn} />
      ) : (
        <>
          <header className="admin-bar">
            <div className="container admin-bar-inner">
              <div className="admin-bar-title">
                <span className="admin-badge">Admin</span>
                <span>Signed in as <strong>{session.admin.name}</strong></span>
              </div>
              <nav className="admin-tabs" aria-label="Admin sections">
                {TABS.map((t) => (
                  <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    {t.label}
                  </NavLink>
                ))}
              </nav>
              <button type="button" className="btn btn-ghost admin-signout" onClick={signOut}>
                Sign out
              </button>
            </div>
          </header>
          <div className="container admin-body">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="admins" element={<AdminAdmins />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="account" element={<AdminAccount admin={session.admin} onSignOut={signOut} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}
