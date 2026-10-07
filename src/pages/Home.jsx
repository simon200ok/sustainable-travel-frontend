import { Link } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary";
import ImpactCard from "../components/ImpactCard";
import JourneyPlanner from "../components/planner/JourneyPlanner";
import "./Home.css";

const quickLinks = [
  { to: "/ticketing", icon: "🎫", title: "Ticketing & Prices", desc: "Today's operator fares, updated daily" },
  { to: "/zones", icon: "🗺️", title: "Travel Zones", desc: "Understand zone boundaries" },
  { to: "/map", icon: "📍", title: "Live Map", desc: "Live 700/701 buses and cycle parking" },
  { to: "/sustainability", icon: "🌱", title: "Go Green", desc: "Sustainable travel tips" },
];

export default function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="container hero-center">
          <h1 className="hero-title">
            Where are you <span className="hero-accent">travelling</span> today?
          </h1>
          <p className="hero-desc">
            Compare walking, cycling, Metro, bus, train and car share — with live times and the CO₂ you save.
          </p>
        </div>
      </section>

      <div className="search-panel-wrapper">
        <div className="container">
          <ErrorBoundary title="The journey planner hit a problem">
            <JourneyPlanner />
          </ErrorBoundary>
        </div>
      </div>

      <section className="section impact-section">
        <div className="container">
          <ImpactCard />
        </div>
      </section>

      <section className="section quick-links-section">
        <div className="container">
          <div className="quick-links-grid">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="quick-link-card">
                <span className="quick-link-icon" aria-hidden="true">{link.icon}</span>
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
                <span className="quick-link-arrow" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Travel Greener Today</h2>
              <p>
                Small changes in how you travel make a big difference. Explore sustainable
                options and find what works for your commute.
              </p>
              <Link to="/sustainability" className="btn btn-primary">
                Sustainability Tips
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
