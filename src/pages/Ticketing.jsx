import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getContentMeta, getFares, getOperators, getTickets } from "../lib/api";
import { formatPrice } from "../lib/format";
import { readableTextOn } from "../lib/colour";
import { useAsyncData } from "../hooks/useAsyncData";
import "./Ticketing.css";

const CATEGORIES = ["All", "Adult", "Young person", "Child", "Family", "Group"];

// Where to buy, by National Operator Code
const OPERATOR_INFO = {
  GNEL: { color: "#E30613", website: "https://www.gonortheast.co.uk", note: "Buy on the Go North East app or contactless on board." },
  SCNE: { color: "#E37124", website: "https://www.stagecoachbus.com", note: "Buy in the Stagecoach Bus app or contactless on board." },
  JHCL: { color: "#1565C0", website: null, note: "Operator of the 700/701 university buses." },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatDate = (iso) => (iso ? dateFormatter.format(new Date(iso)) : "");

const METRO_NOTE_FALLBACK = "Nexus fares in effect from 1 April 2026 (“Mayor's Fares”). Pop Pay As You Go automatically caps what you pay.";

export default function Ticketing() {
  const [category, setCategory] = useState("All");

  const { data, loading, error } = useAsyncData(async () => {
    const [fares, operators, tickets, meta] = await Promise.all([
      getFares().catch(() => ({ operators: [], failed: true })),
      getOperators(),
      getTickets(),
      getContentMeta().catch(() => ({})),
    ]);
    return { fares, operators, tickets, meta };
  }, []);

  const busOperators = useMemo(() => {
    const ops = data?.fares?.operators ?? [];
    return ops
      .map((op) => ({ ...op, fares: op.fares.filter((f) => category === "All" || f.category === category) }))
      .filter((op) => op.fares.length);
  }, [data, category]);

  const metro = useMemo(() => {
    if (!data?.operators) return null;
    const op = data.operators.find((o) => o.type === "Metro");
    if (!op) return null;
    return { ...op, tickets: data.tickets.filter((t) => t.operator_id === op.id) };
  }, [data]);

  const rail = data?.operators?.find((o) => o.type === "Train");

  if (loading) {
    return <div className="page-loading">Loading ticket prices...</div>;
  }

  if (error) {
    return <div className="page-error">Failed to load ticket prices: {error}</div>;
  }

  const hasLiveFares = (data.fares.operators ?? []).length > 0;

  return (
    <div className="page ticketing">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Ticketing & Prices</h1>
          <p className="page-desc">
            Bus fares are pulled every day from the operators' official fares data, so the prices here
            match what you pay. Plan a journey on the home page to see the fare for that exact trip.
          </p>
        </div>
      </section>

      <section className="section ticketing-content">
        <div className="container">
          <div className="filter-bar">
            <span className="filter-label">Show tickets for:</span>
            <div className="filter-chips" role="group" aria-label="Passenger type">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-chip ${category === c ? "active" : ""}`}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === "Young person" ? "Young person (up to 25)" : c}
                </button>
              ))}
            </div>
          </div>

          {!hasLiveFares && (
            <div className="notice notice-info fares-notice">
              <span className="notice-icon" aria-hidden="true">ℹ️</span>
              <div>
                <strong>Live bus fares are being refreshed</strong>
                The daily update from the operators hasn't finished yet. Please check back shortly, or see the operators' websites.
              </div>
            </div>
          )}

          <div className="ticket-operators">
            {busOperators.map((op) => {
              const info = OPERATOR_INFO[op.noc] ?? {};
              return (
                <div key={op.noc} className="ticket-operator-card">
                  <div className="ticket-operator-header">
                    <div className="ticket-operator-info">
                      <span className="ticket-type-badge" style={{ background: info.color || "#555", color: readableTextOn(info.color || "#555") }}>Bus</span>
                      <h2>{op.operator}</h2>
                      <p className="fares-updated">
                        <span className="live-dot" aria-hidden="true" /> Official fares, checked {formatDate(op.syncedAt)}
                        {op.datasetModified && ` · operator last updated ${formatDate(op.datasetModified)}`}
                      </p>
                    </div>
                  </div>

                  <div className="ticket-table-wrapper">
                    <table className="ticket-table">
                      <thead>
                        <tr>
                          <th>Ticket</th>
                          <th>Price</th>
                          <th>Valid for</th>
                          <th>Who</th>
                        </tr>
                      </thead>
                      <tbody>
                        {op.fares.map((fare) => (
                          <tr key={fare.id}>
                            <td className="ticket-name">{fare.product}</td>
                            <td className="ticket-price">{formatPrice(fare.price)}</td>
                            <td>{fare.period}</td>
                            <td className="ticket-note">{fare.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="ticket-operator-footer">
                    <div className="sustainability-note">
                      <span className="eco-icon" aria-hidden="true">🎫</span>
                      <span>{info.note}</span>
                    </div>
                    {info.website && (
                      <a href={info.website} target="_blank" rel="noopener noreferrer" className="operator-website-link">
                        Buy from {op.operator} &rarr;
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {hasLiveFares && busOperators.length === 0 && (
              <p className="fares-empty">No {category.toLowerCase()} bus tickets found. Try another passenger type.</p>
            )}

            {metro && metro.tickets.length > 0 && (category === "All" || category === "Adult" || category === "Young person") && (
              <div className="ticket-operator-card">
                <div className="ticket-operator-header">
                  <div className="ticket-operator-info">
                    <span className="ticket-type-badge" style={{ background: metro.color, color: readableTextOn(metro.color) }}>Metro</span>
                    <h2>{metro.name}</h2>
                    <p>{data.meta?.metro_fares_note || METRO_NOTE_FALLBACK}</p>
                  </div>
                </div>
                <div className="ticket-table-wrapper">
                  <table className="ticket-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Price</th>
                        <th>Valid for</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metro.tickets
                        .filter((t) => category !== "Young person" || /under|21/i.test(t.ticket_type))
                        .map((t) => (
                          <tr key={t.id}>
                            <td className="ticket-name">{t.ticket_type}</td>
                            <td className="ticket-price">{formatPrice(t.price)}</td>
                            <td>{t.duration}</td>
                            <td className="ticket-note">{t.notes}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="ticket-operator-footer">
                  <div className="sustainability-note">
                    <span className="eco-icon" aria-hidden="true">🌿</span>
                    <span>{metro.sustainability_note}</span>
                  </div>
                  <a href={metro.website} target="_blank" rel="noopener noreferrer" className="operator-website-link">
                    Visit Nexus &rarr;
                  </a>
                </div>
              </div>
            )}

            {rail && (
              <div className="ticket-operator-card">
                <div className="ticket-operator-header">
                  <div className="ticket-operator-info">
                    <span className="ticket-type-badge" style={{ background: rail.color, color: readableTextOn(rail.color) }}>Train</span>
                    <h2>{rail.name}</h2>
                    <p>
                      Rail fares depend on where and when you travel. <Link to="/" className="inline-link">Plan your journey</Link> to
                      see the fare for your train trip, and use a 16–25 or 26–30 Railcard to save a third.
                    </p>
                  </div>
                </div>
                <div className="ticket-operator-footer">
                  <div className="sustainability-note">
                    <span className="eco-icon" aria-hidden="true">🌿</span>
                    <span>{rail.sustainability_note}</span>
                  </div>
                  <a href={rail.website} target="_blank" rel="noopener noreferrer" className="operator-website-link">
                    Visit {rail.name} &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>

          <p className="fares-source">
            Bus fares: {data.fares.source || "Bus Open Data Service"}. {data.fares.licence}
          </p>

          <Link to="/contact?topic=travel-info" className="report-link">
            🚩 Spotted a wrong or missing price? Tell us
          </Link>

          <div className="student-tip">
            <div className="student-tip-icon" aria-hidden="true">💡</div>
            <div>
              <h3>Student Tip</h3>
              <p>
                If you're 21 or under, single bus and Metro journeys are just £1. Carry your University of Sunderland
                student ID, and consider weekly tickets if you travel most days — they're cheaper than daily tickets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
