import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJourney } from "../../context/JourneyContext";
import { getLocations, planJourney } from "../../lib/api";
import { ensureNotificationPermission } from "../../lib/reminders";
import { distanceMeters, getCurrentPosition, locationHelp, locationPermissionState, watchLocationPermission } from "../../lib/geo";
import { useDeviceHeading } from "../../hooks/useDeviceHeading";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { CAMPUS_PLACES, useSavedPlaces } from "../../hooks/useSavedPlaces";
import { useTheme } from "../../hooks/useTheme";
import LocationNotice from "../LocationNotice";
import LeaveByAlert from "./LeaveByAlert";
import PlaceInput from "./PlaceInput";
import PlannerMap from "./PlannerMap";
import QuickTrips from "./QuickTrips";
import RouteOptions from "./RouteOptions";
import WhenPicker, { whenPayload } from "./WhenPicker";
import "./Planner.css";

const YOUR_LOCATION = "Your location";
// "Your location" means where you are now: a reading older than this is replaced before searching
const FRESH_LOCATION_MS = 15_000;
const SCOPES = [
  { id: "local", label: "🎓 Campus travel", hint: "Suggestions near you, Sunderland and London campuses" },
  { id: "uk", label: "🗺️ Anywhere in the UK", hint: "Search any town, station or address in the UK" },
];

export default function JourneyPlanner() {
  const online = useOnlineStatus();
  const { resolved: theme } = useTheme();
  const { places, trips, savePlace, saveTrip, removeTrip } = useSavedPlaces();
  const { trip, startTrip } = useJourney();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [inputsKey, setInputsKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("local");
  const [when, setWhen] = useState({ type: "now", time: null });
  const [starting, setStarting] = useState(false);
  const [cycleParks, setCycleParks] = useState([]);
  const [savedMsg, setSavedMsg] = useState("");
  const resultsRef = useRef(null);

  // Keep following the user's position once they've shared it, so the map arrow moves with them
  const live = useLiveLocation(tracking);
  const compass = useDeviceHeading();
  const gpsHeading = live.position?.speed > 0.7 && Number.isFinite(live.position?.heading) ? live.position.heading : null;
  const heading = compass.heading ?? gpsHeading;

  const [locatingSlow, setLocatingSlow] = useState(false);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    // If the browser hasn't answered after a few seconds, its question may be hidden: say where to look
    const slowTimer = setTimeout(() => setLocatingSlow(true), 5000);
    try {
      const pos = await getCurrentPosition({ maxAgeMs: FRESH_LOCATION_MS });
      setOrigin({ label: YOUR_LOCATION, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, isCurrent: true });
      setTracking(true);
      return null;
    } catch (code) {
      setLocationError(code);
      return code;
    } finally {
      clearTimeout(slowTimer);
      setLocatingSlow(false);
      setLocating(false);
    }
  }, []);

  // "I've allowed it. Try again": if location now works, use it straight away (nothing typed is lost).
  // If it's still blocked, reload the page (some browsers only pick up a changed setting after a reload).
  const retryLocate = useCallback(async () => {
    const code = await locate();
    if (code === "denied") window.location.reload();
  }, [locate]);

  // As soon as the user switches location to Allow in the browser's settings, use it (no reload needed)
  const needsLocation = !origin && locationError === "denied";
  useEffect(() => {
    if (!needsLocation) return undefined;
    let stop = null;
    let cancelled = false;
    watchLocationPermission((state) => {
      if (state !== "denied") locate();
    }).then((unsubscribe) => {
      if (cancelled) unsubscribe?.();
      else stop = unsubscribe;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [needsLocation, locate]);

  // "Your location" follows you: it moves when you've moved further than the GPS margin of error
  // (for example during a trip, while this page stays open underneath), and it sharpens as more
  // accurate readings arrive (the first fix may be approximate because it's quicker)
  useEffect(() => {
    const p = live.position;
    if (!p || !Number.isFinite(p.accuracy)) return;
    setOrigin((o) => {
      if (!o?.isCurrent) return o;
      const sharper = !Number.isFinite(o.accuracy) || p.accuracy <= o.accuracy * 0.7;
      const moved = distanceMeters(o, p) > Math.max(25, p.accuracy, Number.isFinite(o.accuracy) ? o.accuracy : 0);
      if (!sharper && !moved) return o;
      return { ...o, lat: p.lat, lng: p.lng, accuracy: p.accuracy };
    });
  }, [live.position]);

  // Before searching (or refreshing a plan) from "Your location": use a reading from the last
  // 15 seconds, or ask for a new one, so the journey starts from where you are now
  const liveRef = useRef(live.position);
  liveRef.current = live.position;
  const freshOrigin = useCallback(async (from) => {
    if (!from?.isCurrent) return from;
    const p = liveRef.current;
    let pos = p && Date.now() - p.at < FRESH_LOCATION_MS ? p : null;
    if (!pos) {
      try {
        pos = await getCurrentPosition({ maxAgeMs: FRESH_LOCATION_MS });
      } catch {
        return from; // couldn't get a new reading: use the last one we had
      }
    }
    const next = { ...from, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy };
    setOrigin((o) => (o?.isCurrent ? next : o));
    return next;
  }, []);

  // Start point defaults to the user's current location (asks the browser on first visit)
  useEffect(() => {
    let cancelled = false;
    locationPermissionState().then((state) => {
      if (cancelled) return;
      if (state === "denied") setLocationError("denied");
      else locate();
    });
    return () => {
      cancelled = true;
    };
  }, [locate]);

  useEffect(() => {
    getLocations()
      .then((locs) => setCycleParks(locs.filter((l) => l.type === "cycle_park")))
      .catch(() => {});
  }, []);

  const search = useCallback(
    async (from = origin, to = destination) => {
      setError("");
      setSavedMsg("");
      if (!from || !to) {
        setError(!from ? "Choose a starting point (or allow location)." : "Choose where you're going.");
        return;
      }
      if (!online) {
        setError("You're offline. Connect to the internet to plan a journey.");
        return;
      }
      setSearching(true);
      setResult(null);
      setSelected(null);
      try {
        from = await freshOrigin(from);
        const data = await planJourney(
          { label: from.label, lat: from.lat, lng: from.lng },
          { label: to.label, lat: to.lat, lng: to.lng },
          whenPayload(when),
        );
        setResult(data);
        setSelected(data.options[0] ?? null);
        requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      } catch (err) {
        setError(err.message);
      } finally {
        setSearching(false);
      }
    },
    [origin, destination, online, when, freshOrigin],
  );

  // Changing the time after a search updates the results (after a short pause while typing)
  const searchRef = useRef(search);
  searchRef.current = search;
  const hasResult = Boolean(result);
  const whenKey = `${when.type}|${when.time?.getTime() ?? ""}`;
  useEffect(() => {
    if (!hasResult) return undefined;
    const timer = setTimeout(() => searchRef.current(), 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whenKey]);

  // "Leave now" plans are refreshed when you press Start if they're a few minutes old,
  // so the bus times and arrival time match the moment you actually set off
  async function start(option) {
    if (trip && !trip.arrived && !window.confirm(`End your journey to ${trip.destination.label} and start this one?`)) return;
    // Bus / Metro / train trips: ask (once, while the user is tapping Start) to allow the
    // "get off soon" notifications. Asking must happen straight from a tap on iPhone.
    if (option.steps?.some((s) => s.transit)) await ensureNotificationPermission();
    let chosen = option;
    let from = origin;
    const stale = result?.when?.type !== "depart" && result?.when?.type !== "arrive" && Date.now() - Date.parse(result?.generatedAt) > 3 * 60_000;
    if (stale && online) {
      setStarting(true);
      try {
        from = await freshOrigin(origin);
        const fresh = await planJourney(
          { label: from.label, lat: from.lat, lng: from.lng },
          { label: destination.label, lat: destination.lat, lng: destination.lng },
        );
        setResult(fresh);
        chosen = fresh.options.find((o) => o.mode === option.mode) || option;
      } catch {
        // Offline or busy: start with the plan we have
      } finally {
        setStarting(false);
      }
    }
    setSelected(chosen);
    startTrip(from, destination, chosen);
  }

  const quickOriginOptions = useMemo(
    () => [
      { key: "gps", label: "📍 Your location", hint: "Use GPS", onSelect: locate },
      ...["home", "work"].filter((s) => places[s]).map((s) => ({ key: s, label: `${s === "home" ? "🏠 Home" : "💼 Work"}`, hint: places[s].label, place: places[s] })),
      ...CAMPUS_PLACES.map((c) => ({ key: c.id, label: `🎓 ${c.label}`, hint: "University of Sunderland", place: c })),
    ],
    [places, locate],
  );

  const quickDestinationOptions = useMemo(
    () => [
      ...CAMPUS_PLACES.map((c) => ({ key: c.id, label: `🎓 ${c.label}`, hint: "University of Sunderland", place: c })),
      ...["home", "work"].filter((s) => places[s]).map((s) => ({ key: s, label: `${s === "home" ? "🏠 Home" : "💼 Work"}`, hint: places[s].label, place: places[s] })),
    ],
    [places],
  );

  function swap() {
    setOrigin(destination);
    setDestination(origin);
    setInputsKey((k) => k + 1);
    setResult(null);
  }

  function runTrip(from, to) {
    setOrigin(from);
    setDestination(to);
    setInputsKey((k) => k + 1);
    search(from, to);
  }

  function saveSlot(slot, place) {
    savePlace(slot, place);
    setSavedMsg(`Saved “${place.label}” as ${slot === "home" ? "Home" : "Work"}.`);
  }

  const savablePlace = destination && !CAMPUS_PLACES.some((c) => c.label === destination.label) ? destination : null;
  const userPosition = live.position ?? (origin?.isCurrent ? origin : null);

  return (
    <div className="planner">
      <form
        className="planner-form"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <div className="planner-scope" role="radiogroup" aria-label="Where are you travelling?">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={scope === s.id}
              className={scope === s.id ? "active" : ""}
              title={s.hint}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="planner-fields">
          <PlaceInput
            key={`o-${inputsKey}`}
            label="Starting point"
            icon="🟢"
            value={origin}
            onChange={setOrigin}
            placeholder={locating ? "Finding your location…" : scope === "uk" ? "Your location or anywhere in the UK" : "Your location or any address"}
            near={origin?.isCurrent ? origin : null}
            scope={scope}
            quickOptions={quickOriginOptions}
          />
          <button type="button" className="planner-swap" onClick={swap} aria-label="Swap start and destination">
            ⇅
          </button>
          <PlaceInput
            key={`d-${inputsKey}`}
            label="Destination"
            icon="🟠"
            value={destination}
            onChange={setDestination}
            placeholder={scope === "uk" ? "Any town, station or address in the UK" : "Where are you going?"}
            near={origin}
            scope={scope}
            quickOptions={quickDestinationOptions}
          />
        </div>

        <WhenPicker value={when} onChange={setWhen} />

        <div className="planner-actions">
          <button type="button" className="btn btn-ghost" onClick={locate} disabled={locating}>
            {locating ? <span className="spinner" /> : "📍"} Use my location
          </button>
          <button type="submit" className="btn btn-primary planner-search" disabled={searching}>
            {searching ? <span className="spinner" /> : "🔍"} {searching ? "Finding green routes…" : "Search"}
          </button>
        </div>

        {locating && locatingSlow && (
          <div className="notice notice-info" role="status">
            <span className="notice-icon" aria-hidden="true">📍</span>
            <div>
              <strong>Waiting for your browser to share your location…</strong>
              If you can't see a question asking to use your location, the browser may have hidden it. {locationHelp()} You
              can also type a starting point.
            </div>
          </div>
        )}
        {locationError && !origin && (
          <LocationNotice
            code={locationError}
            onRetry={retryLocate}
            onDismiss={() => setLocationError(null)}
          />
        )}
        {error && (
          <div className="notice notice-error" role="alert">
            <span className="notice-icon" aria-hidden="true">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <div className="planner-save-row">
          {savablePlace && (
            <>
              <button type="button" className="link-button" onClick={() => saveSlot("home", savablePlace)}>☆ Save as Home</button>
              <button type="button" className="link-button" onClick={() => saveSlot("work", savablePlace)}>☆ Save as Work</button>
            </>
          )}
          {result && origin && destination && (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                saveTrip(origin, destination, selected ? { mode: selected.mode, minutes: selected.minutes } : null);
                setSavedMsg("Trip saved. It's now a one-tap button, even offline.");
              }}
            >
              ⭐ Save this trip
            </button>
          )}
          {savedMsg && <span className="planner-saved-msg" role="status">{savedMsg}</span>}
        </div>

        <QuickTrips places={places} trips={trips} onTrip={runTrip} onRemoveTrip={removeTrip} />
      </form>

      <div className="planner-body" ref={resultsRef}>
        <div className="planner-results">
          {searching && (
            <div className="planner-skeleton" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
            </div>
          )}
          {result && (
            <>
              {selected && !result.when?.past && <LeaveByAlert key={selected.mode + selected.leaveBy} option={selected} />}
              <RouteOptions
                result={result}
                selected={selected}
                onSelect={setSelected}
                onStart={start}
                starting={starting}
              />
            </>
          )}
          {!result && !searching && (
            <div className="planner-empty">
              <h3>{scope === "uk" ? "Plan a green journey anywhere in the UK" : "Compare every green way to travel"}</h3>
              <p>Walk, cycle, Metro, bus, train and car share, with live times, CO₂ saved and turn-by-turn voice directions.</p>
            </div>
          )}
        </div>
        <PlannerMap
          origin={origin}
          destination={destination}
          option={selected}
          userPosition={userPosition}
          heading={heading}
          compass={compass}
          cycleParks={cycleParks}
          theme={theme}
        />
      </div>
    </div>
  );
}
