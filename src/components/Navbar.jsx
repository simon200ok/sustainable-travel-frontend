import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/ticketing', label: 'Ticketing' },
  { path: '/zones', label: 'Zones' },
  { path: '/map', label: 'Map' },
  { path: '/sustainability', label: 'Sustainability' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          {/* The logo includes the name; the light or dark version shows to match the theme */}
          <img src="/brand/logo-light.svg" alt="Sustainable Travel Hub" className="brand-logo brand-logo-light" width="138" height="40" />
          <img src="/brand/logo-dark.svg" alt="" aria-hidden="true" className="brand-logo brand-logo-dark" width="138" height="40" />
        </NavLink>

        <div className="navbar-end">
          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <ThemeToggle />

          <button
            className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
