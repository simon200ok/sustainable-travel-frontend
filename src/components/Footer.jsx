import { NavLink } from 'react-router-dom';
import './Footer.css';
import UosLogo from '/images/apple-touch-icon.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-logo">
                <img 
                  src={UosLogo} 
                  alt="Logo" 
                  className="logo-icon-1"
                />
              </div>
              <div>
                <h3>Sustainable Travel Hub</h3>
                <p>University of Sunderland</p>
              </div>
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
            <NavLink to="/privacy">Privacy Policy</NavLink>
          </div>

          <div className="footer-col">
            <h4>Transport Operators</h4>
            <a href="https://www.gonortheast.co.uk" target="_blank" rel="noopener noreferrer">Go North East</a>
            <a href="https://www.nexus.org.uk" target="_blank" rel="noopener noreferrer">Nexus Metro</a>
            <a href="https://www.northernrailway.co.uk" target="_blank" rel="noopener noreferrer">Northern Trains</a>
            <a href="https://www.stagecoachbus.com" target="_blank" rel="noopener noreferrer">Stagecoach</a>
          </div>

          <div className="footer-col">
            <h4>University Links</h4>
            <a href="https://www.sunderland.ac.uk" target="_blank" rel="noopener noreferrer">UoS Website</a>
            <a href="https://www.sunderland.ac.uk/about/sustainability/" target="_blank" rel="noopener noreferrer">Sustainability Team</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} University of Sunderland Developer Society. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
