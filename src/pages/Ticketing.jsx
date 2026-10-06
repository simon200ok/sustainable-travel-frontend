// Updated code
import { useMemo, useState } from "react";
import { getOperators, getTickets } from "../lib/api";
import { useAsyncData } from "../hooks/useAsyncData";
import "./Ticketing.css";

function formatPrice(value) {
  return `£${Number(value).toFixed(2)}`;
}

export default function Ticketing() {
  const [activeOperator, setActiveOperator] = useState("all");

  const { data, loading, error } = useAsyncData(async () => {
    const [operators, tickets] = await Promise.all([getOperators(), getTickets()]);

    return operators.map((operator) => ({
      ...operator,
      tickets: tickets
        .filter((ticket) => ticket.operator_id === operator.id)
        .map((ticket) => ({
          id: ticket.id,
          name: ticket.ticket_type,
          price: formatPrice(ticket.price),
          duration: ticket.duration,
          note: ticket.notes ?? "",
        })),
    }));
  }, []);

  const filtered = useMemo(() => {
    if (activeOperator === "all") return data;
    return data.filter((op) => op.id === Number(activeOperator));
  }, [data, activeOperator]);

  if (loading) {
    return <div className="page-loading">Loading ticket prices...</div>;
  }

  if (error) {
    return <div className="page-error">Failed to load ticket prices: {error}</div>;
  }

  return (
    <div className="page ticketing">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Ticketing & Prices</h1>
          <p className="page-desc">
            Compare ticket prices across all transport operators serving the University of Sunderland.
            Prices shown are standard fares — always check the operator's website for the latest.
          </p>
        </div>
      </section>

      <section className="section ticketing-content">
        <div className="container">
          <div className="filter-bar">
            <span className="filter-label">Filter by operator:</span>
           
           {/* START HERE */}
            <div className="filter-chips">
              <button
                className={`filter-chip ${activeOperator === 'all' ? 'active' : ''}`}
                onClick={() => setActiveOperator('all')}
              >
                All Operators
              </button>
              {data.map((op) => (
                <button
                  key={op.id}
                  className={`filter-chip ${activeOperator === op.id ? 'active' : ''}`}
                  onClick={() => setActiveOperator(op.id)}
                  style={activeOperator === op.id ? { background: op.color, borderColor: op.color } : {}}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ticket-operators">
            {filtered.map((op) => (
              <div key={op.id} className="ticket-operator-card">
                <div className="ticket-operator-header">
                  <div className="ticket-operator-info">
                    <span className="ticket-type-badge" style={{ background: op.color }}>
                      {op.type}
                    </span>
                    <h2>{op.name}</h2>
                    <p>{op.description}</p>
                  </div>
                </div>

                <div className="ticket-table-wrapper">
                  <table className="ticket-table">
                    <thead>
                      <tr>
                        <th>Ticket Type</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {op.tickets.map((ticket, i) => (
                        <tr key={i}>
                          <td className="ticket-name">{ticket.name}</td>
                          <td className="ticket-price">{ticket.price}</td>
                          <td>{ticket.duration}</td>
                          <td className="ticket-note">{ticket.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ticket-operator-footer">
                  <div className="sustainability-note">
                    <span className="eco-icon">🌿</span>
                    <span>{op.sustainability_note}</span>
                  </div>
                  <a
                    href={op.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="operator-website-link"
                  >
                    Visit {op.name} &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="student-tip">
            <div className="student-tip-icon">💡</div>
            <div>
              <h3>Student Tip</h3>
              <p>
                Always carry your University of Sunderland student ID when travelling.
                Some operators offer discounts or require it for student-priced tickets.
                Consider weekly or term passes if you travel regularly — they offer significant savings over daily tickets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
