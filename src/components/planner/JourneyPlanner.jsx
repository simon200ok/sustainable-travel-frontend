import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJourney } from "../../context/JourneyContext";
import { getLocations, planJourney } from "../../lib/api";
import { getCurrentPosition, locationPermissionState } from "../../lib/geo";
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
import "./Planner.css";

const YOUR_LOCATION = "Your location";
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
  const [cycleParks, setCycleParks] = useState([]);
  const [savedMsg, setSavedMsg] = useState("");
  const resultsRef = useRef(null);

  // Keep following the user's position once they've shared it, so the map arrow moves with them
  const live = useLiveLocation(tracking);
  const compass = useDeviceHeading();
  const gpsHeading = live.position?.speed > 0.7 && Number.isFinite(live.position?.heading) ? live.position.heading : null;
  const heading = compass.heading ?? gpsHeading;

  const locate = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      setOrigin({ label: YOUR_LOCATION, lat: pos.lat, lng: pos.lng, isCurrent: true });
      setTracking(true);
    } catch (code) {
      setLocationError(code);
    } finally {
      setLocating(false);
    }
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
        const data = await planJourney(
          { label: from.label, lat: from.lat, lng: from.lng },
          { label: to.label, lat: to.lat, lng: to.lng },
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
    [origin, destination, online],
  );

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

        <div className="planner-actions">
          <button type="button" className="btn btn-ghost" onClick={locate} disabled={locating}>
            {locating ? <span className="spinner" /> : "📍"} Use my location
          </button>
          <button type="submit" className="btn btn-primary planner-search" disabled={searching}>
            {searching ? <span className="spinner" /> : "🔍"} {searching ? "Finding green routes…" : "Search"}
          </button>
        </div>

        {locationError && !origin && (
          <LocationNotice code={locationError} onRetry={locate} onDismiss={() => setLocationError(null)} />
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
                setSavedMsg("Trip saved — it's now a one-tap button, even offline.");
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
              {selected && <LeaveByAlert key={selected.mode + selected.leaveBy} option={selected} />}
              <RouteOptions
                result={result}
                selected={selected}
                onSelect={setSelected}
                onStart={(option) => {
                  if (trip && !trip.arrived && !window.confirm(`End your journey to ${trip.destination.label} and start this one?`)) return;
                  setSelected(option);
                  startTrip(origin, destination, option);
                }}
              />
            </>
          )}
          {!result && !searching && (
            <div className="planner-empty">
              <h3>{scope === "uk" ? "Plan a green journey anywhere in the UK" : "Compare every green way to travel"}</h3>
              <p>Walk, cycle, Metro, bus, train and car share — with live times, CO₂ saved and turn-by-turn voice directions.</p>
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
