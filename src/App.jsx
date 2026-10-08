import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import InstallBanner from './components/InstallBanner';
import Home from './pages/Home';
import Ticketing from './pages/Ticketing';
import Zones from './pages/Zones';
import TravelMap from './pages/TravelMap';
import Sustainability from './pages/Sustainability';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Accessibility from './pages/Accessibility';
import { restoreReminders } from './lib/reminders';
import { speak } from './lib/speech';
import './components/AppBanners.css';

// The admin area is a separate download: ordinary visitors never load its code
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function NotFound() {
  return (
    <div className="page-loading">
      <h1 className="section-title">Page not found</h1>
      <p>
        <Link to="/" className="inline-link">Go to the journey planner</Link> or{' '}
        <Link to="/contact" className="inline-link">tell us about a broken link</Link>
      </p>
    </div>
  );
}

// Shows leave-by reminders in the app (alongside any system notification)
function ReminderToast() {
  const [reminder, setReminder] = useState(null);
  useEffect(() => {
    restoreReminders();
    const onReminder = (e) => {
      setReminder(e.detail);
      speak(`${e.detail.title}. ${e.detail.body}`);
    };
    window.addEventListener('uos-reminder', onReminder);
    return () => window.removeEventListener('uos-reminder', onReminder);
  }, []);
  if (!reminder) return null;
  return (
    <div className="update-toast" role="alert">
      <span aria-hidden="true">⏰</span>
      <span>
        <strong>{reminder.title}</strong> — {reminder.body}
      </span>
      <button type="button" className="app-banner-btn" onClick={() => setReminder(null)}>
        OK
      </button>
    </div>
  );
}

function App() {
  return (
    <>
      <a href="#main" className="visually-hidden">Skip to content</a>
      <OfflineBanner />
      <InstallBanner />
      <Navbar />
      <main id="main" style={{ flex: 1 }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ticketing" element={<Ticketing />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/map" element={<TravelMap />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div className="page-loading"><span className="spinner" /> Loading admin…</div>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <ReminderToast />
    </>
  );
}

export default App;
