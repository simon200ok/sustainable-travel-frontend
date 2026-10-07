import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocations, planJourney } from "../../lib/api";
import { getCurrentPosition, locationPermissionState } from "../../lib/geo";
import { useImpact } from "../../hooks/useImpact";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { CAMPUS_PLACES, useSavedPlaces } from "../../hooks/useSavedPlaces";
import { useTheme } from "../../hooks/useTheme";
import LocationNotice from "../LocationNotice";
import LeaveByAlert from "./LeaveByAlert";
import NavigationPanel from "./NavigationPanel";
import PlaceInput from "./PlaceInput";
import PlannerMap from "./PlannerMap";
import QuickTrips from "./QuickTrips";
import RouteOptions from "./RouteOptions";
import "./Planner.css";

const YOUR_LOCATION = "Your location";

export default function JourneyPlanner() {
  const online = useOnlineStatus();
  const { resolved: theme } = useTheme();
  const { places, trips, savePlace, saveTrip, removeTrip } = useSavedPlaces();
  const { stats, recordJourney } = useImpact();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [inputsKey, setInputsKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [following, setFollowing] = useState(true);
  const [cycleParks, setCycleParks] = useState([]);
  const [savedMsg, setSavedMsg] = useState("");
  const resultsRef = useRef(null);

  const live = useLiveLocation(navigating);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      setOrigin({ label: YOUR_LOCATION, lat: pos.lat, lng: pos.lng, isCurrent: true });
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
  const userPosition = navigating ? live.position : origin?.isCurrent ? origin : null;

  if (navigating && selected) {
    return (
      <div className="planner planner-navigating">
        <PlannerMap
          origin={origin}
          destination={destination}
          option={selected}
          userPosition={live.position}
          navigating
          following={following}
          onUserPan={() => setFollowing(false)}
          cycleParks={cycleParks}
          theme={theme}
        />
        {!following && (
          <button type="button" className="btn btn-primary recenter-btn" onClick={() => setFollowing(true)}>
            ◎ Re-centre
          </button>
        )}
        <NavigationPanel
          option={selected}
          destination={destination}
          position={live.position}
          locationError={live.error}
          onRetryLocation={() => {
            setNavigating(false);
            setTimeout(() => setNavigating(true), 50);
          }}
          onReroute={(next) => setSelected(next)}
          onArrive={() => recordJourney(selected)}
          onExit={() => {
            setNavigating(false);
            setFollowing(true);
          }}
          impact={stats}
        />
      </div>
    );
  }

  return (
    <div className="planner">
      <form
        className="planner-form"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <div className="planner-fields">
          <PlaceInput
            key={`o-${inputsKey}`}
            label="Starting point"
            icon="🟢"
            value={origin}
            onChange={setOrigin}
            placeholder={locating ? "Finding your location…" : "Your location or any address"}
            near={origin?.isCurrent ? origin : null}
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
            placeholder="Where are you going?"
            near={origin}
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
                  setSelected(option);
                  setFollowing(true);
                  setNavigating(true);
                }}
              />
            </>
          )}
          {!result && !searching && (
            <div className="planner-empty">
              <h3>Compare every green way to travel</h3>
              <p>Walk, cycle, Metro, bus, train and car share — with live times, CO₂ saved and turn-by-turn voice directions.</p>
            </div>
          )}
        </div>
        <PlannerMap
          origin={origin}
          destination={destination}
          option={selected}
          userPosition={userPosition}
          cycleParks={cycleParks}
          theme={theme}
        />
      </div>
    </div>
  );
}
