import { useEffect, useState } from 'react';
import { createTicket, deleteTicket, listContentTickets, updateTicket } from '../../../lib/adminApi';

const DURATIONS = ['Single', 'Return', 'Day', 'Week', '4 Weeks', 'Month', 'Term', 'Year'];
const EMPTY = { operator_id: '', ticket_type: '', price: '', duration: 'Single', notes: '' };

function FareRow({ ticket, onSaved, onDeleted }) {
  const [form, setForm] = useState({ ticket_type: ticket.ticketType, price: ticket.price, duration: ticket.duration, notes: ticket.notes });
  const [state, setState] = useState('');
  const dirty =
    form.ticket_type !== ticket.ticketType ||
    Number(form.price) !== ticket.price ||
    form.duration !== ticket.duration ||
    form.notes !== ticket.notes;
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  async function save() {
    setState('Saving…');
    try {
      onSaved(await updateTicket(ticket.id, { ...form, price: Number(form.price) }));
      setState('Saved ✓');
    } catch (err) {
      setState(err.message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${ticket.ticketType}”?`)) return;
    try {
      await deleteTicket(ticket.id);
      onDeleted(ticket.id);
    } catch (err) {
      setState(err.message);
    }
  }

  return (
    <tr>
      <td>{ticket.operatorName}</td>
      <td><input aria-label="Ticket name" value={form.ticket_type} maxLength={100} onChange={set('ticket_type')} /></td>
      <td><input aria-label="Price in pounds" type="number" min="0" max="2000" step="0.05" value={form.price} onChange={set('price')} className="admin-input-price" /></td>
      <td>
        <select aria-label="Valid for" value={form.duration} onChange={set('duration')}>
          {DURATIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </td>
      <td><input aria-label="Notes" value={form.notes} maxLength={200} onChange={set('notes')} /></td>
      <td className="admin-row-actions">
        <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={save}>Save</button>
        <button type="button" className="btn btn-ghost admin-danger" onClick={remove}>Delete</button>
        {state && <span className="admin-muted" role="status">{state}</span>}
      </td>
    </tr>
  );
}

export default function AdminFares() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState('');

  useEffect(() => {
    listContentTickets().then(setData).catch((err) => setError(err.message));
  }, []);

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  async function add(e) {
    e.preventDefault();
    setAdding('Adding…');
    try {
      const ticket = await createTicket({ ...form, operator_id: Number(form.operator_id), price: Number(form.price) });
      setData((d) => ({ ...d, tickets: [...d.tickets, ticket] }));
      setForm({ ...EMPTY, operator_id: form.operator_id });
      setAdding('Added ✓');
    } catch (err) {
      setAdding(err.message);
    }
  }

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!data) return <p className="admin-muted"><span className="spinner" /> Loading fares…</p>;

  return (
    <section className="admin-panel admin-panel-wide">
      <h2>Manually maintained fares</h2>
      <p className="admin-muted">
        Metro fares now update automatically every morning from Travel North East (Nexus), like bus fares. The Metro
        fares below are a backup: the Ticketing page shows them only if the automatic update ever stops working. Use this
        list for that, or for other tickets that aren't published online.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table admin-edit-table">
          <thead>
            <tr><th>Operator</th><th>Ticket</th><th>Price (£)</th><th>Valid for</th><th>Notes</th><th /></tr>
          </thead>
          <tbody>
            {data.tickets.map((t) => (
              <FareRow
                key={t.id}
                ticket={t}
                onSaved={(updated) => setData((d) => ({ ...d, tickets: d.tickets.map((x) => (x.id === updated.id ? updated : x)) }))}
                onDeleted={(id) => setData((d) => ({ ...d, tickets: d.tickets.filter((x) => x.id !== id) }))}
              />
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subheading">Add a fare</h3>
      <form className="admin-inline-form" onSubmit={add}>
        <label>Operator
          <select required value={form.operator_id} onChange={set('operator_id')}>
            <option value="" disabled>Choose…</option>
            {data.operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label>Ticket name<input required minLength={2} maxLength={100} value={form.ticket_type} onChange={set('ticket_type')} /></label>
        <label>Price (£)<input required type="number" min="0" max="2000" step="0.05" value={form.price} onChange={set('price')} /></label>
        <label>Valid for
          <select value={form.duration} onChange={set('duration')}>
            {DURATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label>Notes<input maxLength={200} value={form.notes} onChange={set('notes')} /></label>
        <button type="submit" className="btn btn-primary">Add fare</button>
        {adding && <span className="admin-muted" role="status">{adding}</span>}
      </form>
    </section>
  );
}
