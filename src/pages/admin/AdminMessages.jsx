import { useCallback, useEffect, useState } from 'react';
import { deleteMessage, eraseMessagesFrom, getMessage, listMessages, updateMessage } from '../../lib/adminApi';
import { CONTACT_TOPICS } from '../../lib/contactTopics';

const FILTERS = [
  { value: 'new', label: 'New' },
  { value: 'all', label: 'All' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'spam', label: 'Spam' },
];
const TOPIC_LABEL = Object.fromEntries(CONTACT_TOPICS.map((t) => [t.value, t.label]));
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function MessageDetail({ id, onChanged, onDeleted }) {
  const [message, setMessage] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMessage(id)
      .then((m) => {
        if (cancelled) return;
        setMessage(m);
        setNote(m.adminNote);
        setInfo('');
        onChanged();
      })
      .catch((err) => !cancelled && setInfo(err.message));
    return () => {
      cancelled = true;
    };
  }, [id, onChanged]);

  async function save(changes, done) {
    setBusy(true);
    try {
      const m = await updateMessage(id, changes);
      setMessage(m);
      setInfo(done);
      onChanged();
    } catch (err) {
      setInfo(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await deleteMessage(id);
      onDeleted();
    } catch (err) {
      setInfo(err.message);
    }
  }

  async function erase() {
    if (!window.confirm(`Delete every message from ${message.email}? Use this for data-deletion requests. This can't be undone.`)) return;
    try {
      const { deleted } = await eraseMessagesFrom(message.email);
      window.alert(`${deleted} message(s) deleted.`);
      onDeleted();
    } catch (err) {
      setInfo(err.message);
    }
  }

  if (!message) return <div className="admin-detail admin-muted">{info || <><span className="spinner" /> Loading…</>}</div>;

  const reply = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

  return (
    <article className="admin-detail" aria-label="Message">
      <header className="admin-detail-head">
        <h2>{message.subject}</h2>
        <span className={`admin-status admin-status-${message.status}`}>{message.status}</span>
      </header>
      <dl className="admin-meta">
        <dt>From</dt><dd>{message.name} &lt;{message.email}&gt;</dd>
        <dt>Topic</dt><dd>{TOPIC_LABEL[message.category] || message.category}</dd>
        <dt>Received</dt><dd>{dateTime.format(new Date(message.createdAt))}</dd>
      </dl>
      {/* Rendered as plain text: React escapes it, so message content can never run as code */}
      <div className="admin-message-body">{message.message}</div>

      <div className="admin-actions">
        <a className="btn btn-primary" href={reply}>✉️ Reply by email</a>
        {message.status !== 'resolved' && (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save({ status: 'resolved' }, 'Marked as resolved.')}>✓ Resolved</button>
        )}
        {message.status !== 'spam' ? (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save({ status: 'spam' }, 'Moved to spam (deleted after 30 days).')}>🚫 Spam</button>
        ) : (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save({ status: 'read' }, 'Moved out of spam.')}>Not spam</button>
        )}
        {message.status !== 'new' && (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save({ status: 'new' }, 'Marked as unread.')}>Mark unread</button>
        )}
      </div>

      <label className="admin-label" htmlFor="admin-note">Internal note (only admins see this)</label>
      <textarea id="admin-note" className="admin-note" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="admin-actions">
        <button type="button" className="btn btn-ghost" disabled={busy || note === message.adminNote} onClick={() => save({ admin_note: note }, 'Note saved.')}>Save note</button>
        <button type="button" className="btn btn-ghost admin-danger" onClick={remove}>Delete</button>
        <button type="button" className="btn btn-ghost admin-danger" onClick={erase}>Erase all from this sender</button>
      </div>
      {info && <p className="admin-muted" role="status">{info}</p>}
    </article>
  );
}

export default function AdminMessages() {
  const [filter, setFilter] = useState('new');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listMessages({ status: filter, q: search, page })
      .then((r) => !cancelled && setResult(r))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [filter, search, page, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="admin-messages">
      <div className="admin-toolbar">
        <div className="admin-filters" role="group" aria-label="Filter messages">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter-chip ${filter === f.value ? 'active' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
                setSelected(null);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          className="admin-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query);
            setPage(1);
          }}
        >
          <input type="search" placeholder="Search name, email or subject" maxLength={100} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search messages" />
          <button type="submit" className="btn btn-ghost">Search</button>
        </form>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-split">
        <div className="admin-list">
          {!result ? (
            <p className="admin-muted"><span className="spinner" /> Loading…</p>
          ) : result.items.length === 0 ? (
            <p className="admin-muted">No messages here.</p>
          ) : (
            <ul>
              {result.items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`admin-list-item ${selected === m.id ? 'selected' : ''} ${m.status === 'new' ? 'unread' : ''}`}
                    onClick={() => setSelected(m.id)}
                  >
                    <span className="admin-list-top">
                      <strong>{m.name}</strong>
                      <time>{dateTime.format(new Date(m.createdAt))}</time>
                    </span>
                    <span className="admin-list-subject">{m.subject}</span>
                    <span className="admin-list-preview">{m.preview}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {result && pages > 1 && (
            <div className="admin-pager">
              <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>◀</button>
              <span>Page {page} of {pages}</span>
              <button type="button" className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>▶</button>
            </div>
          )}
        </div>

        {selected ? (
          <MessageDetail
            key={selected}
            id={selected}
            onChanged={refresh}
            onDeleted={() => {
              setSelected(null);
              refresh();
            }}
          />
        ) : (
          <div className="admin-detail admin-muted">Select a message to read it.</div>
        )}
      </div>
    </div>
  );
}
