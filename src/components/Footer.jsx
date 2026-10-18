import { Link, NavLink } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              {/* The footer is dark in both themes, so it uses the logo for dark backgrounds */}
              <img src="/brand/logo-dark.svg" alt="Sustainable Travel Hub" className="footer-brand-logo" width="152" height="44" />
            </div>
            <p className="footer-desc">
              Helping students make informed, sustainable travel choices across the North East.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <NavLink to="/ticketing">Ticketing & Prices</NavLink>
            <NavLink to="/zones">Travel Zones</NavLink>
            <NavLink to="/map">Live Map</NavLink>
            <NavLink to="/sustainability">Sustainability Tips</NavLink>
            <NavLink to="/contact">Contact Us</NavLink>
            <NavLink to="/privacy">Privacy Notice</NavLink>
            <Link to="/privacy#choices">Privacy Choices</Link>
            <NavLink to="/terms">Terms of Use</NavLink>
            <NavLink to="/accessibility">Accessibility</NavLink>
            <NavLink to="/admin">Admin Sign-in</NavLink>
          </div>

          <div className="footer-col">
            <h4>Transport Operators</h4>
            <a href="https://www.gonortheast.co.uk" target="_blank" rel="noopener noreferrer">Go North East</a>
            <a href="https://www.nexus.org.uk" target="_blank" rel="noopener noreferrer">Nexus Metro</a>
            <a href="https://www.northernrailway.co.uk" target="_blank" rel="noopener noreferrer">Northern Trains</a>
            <a href="https://www.stagecoachbus.com" target="_blank" rel="noopener noreferrer">Stagecoach</a>
          </div>

          <div className="footer-col">
            <h4>Useful Links</h4>
            <a href="https://www.sunderland.ac.uk" target="_blank" rel="noopener noreferrer">University of Sunderland website</a>
            <a href="https://www.sunderland.ac.uk/about/sustainability/" target="_blank" rel="noopener noreferrer">University sustainability team</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} University of Sunderland Developer Society. All rights reserved.</p>
          <p className="footer-independent">An independent project. Not an official University of Sunderland service.</p>
        </div>
      </div>
    </footer>
  );
}
