import { useEffect, useId, useRef, useState } from "react";
import { getPlace, getPlaceSuggestions } from "../../lib/api";
import { newSessionToken } from "../../lib/storage";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

/**
 * Text box with live place suggestions (Google Places via our backend).
 * `quickOptions` (your location, saved places, campuses) show when the box is empty.
 */
export default function PlaceInput({ label, icon, value, onChange, placeholder, near, quickOptions = [], autoFocus }) {
  const inputId = useId();
  const listId = useId();
  const [text, setText] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const session = useRef(null);
  const blurTimer = useRef(null);

  // Keep the box in sync when a place is set from outside (saved trip, GPS, campus chip)
  useEffect(() => {
    if (value) setText(value.label ?? "");
  }, [value]);

  useEffect(() => {
    const query = text.trim();
    if (!open || query.length < MIN_CHARS || query === value?.label) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        session.current ??= newSessionToken();
        const results = await getPlaceSuggestions(query, { session: session.current, near, signal: controller.signal });
        setSuggestions(results);
        setActive(results.length ? 0 : -1);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, open, near, value?.label]);

  const showQuick = open && text.trim().length < MIN_CHARS && quickOptions.length > 0;
  const items = showQuick
    ? quickOptions.map((q) => ({ key: q.key, main: q.label, secondary: q.hint, quick: q }))
    : suggestions.map((s) => ({ key: s.placeId, main: s.main || s.label, secondary: s.secondary, suggestion: s }));

  async function choose(item) {
    setOpen(false);
    setError("");
    if (item.quick) {
      item.quick.onSelect ? item.quick.onSelect() : onChange(item.quick.place);
      return;
    }
    const s = item.suggestion;
    setText(s.main || s.label);
    setLoading(true);
    try {
      const place = await getPlace(s.placeId, { session: session.current });
      onChange({ ...place, label: s.main || place.label || s.label });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      session.current = null; // a session ends with the details lookup
    }
  }

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="place-input">
      <label htmlFor={inputId} className="place-input-label">
        {label}
      </label>
      <div className="place-input-field">
        <span className="place-input-icon" aria-hidden="true">{icon}</span>
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && open ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck="false"
          maxLength={100}
          placeholder={placeholder}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
        />
        {loading && <span className="spinner place-input-spinner" aria-label="Searching" />}
        {text && !loading && (
          <button
            type="button"
            className="place-input-clear"
            aria-label={`Clear ${label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setText("");
              onChange(null);
              setOpen(true);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && items.length > 0 && (
        <ul id={listId} role="listbox" className="place-suggestions">
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="place-suggestion-main">{item.main}</span>
              {item.secondary && <span className="place-suggestion-secondary">{item.secondary}</span>}
            </li>
          ))}
          {!showQuick && <li className="place-suggestions-attribution" aria-hidden="true">Powered by Google</li>}
        </ul>
      )}
      {open && !loading && !showQuick && text.trim().length >= MIN_CHARS && !items.length && !error && text !== value?.label && (
        <p className="place-input-hint">No matching places found.</p>
      )}
      {error && <p className="place-input-error" role="alert">{error}</p>}
    </div>
  );
}
