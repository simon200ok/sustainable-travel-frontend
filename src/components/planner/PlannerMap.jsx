import { useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, AdvancedMarker, AdvancedMarkerAnchorPoint, Map, Polyline, useMap } from "@vis.gl/react-google-maps";
import { areaStatusText, projectVehicle, useAreaVehicles } from "../../hooks/useAreaVehicles";
import { distanceMeters } from "../../lib/geo";
import { readJSON, writeJSON } from "../../lib/storage";
import { MODE_META } from "../../lib/format";
import { SUNDERLAND } from "../../lib/geo";
import { boundsOf, decodePolyline, stepPath } from "../../lib/navigation";
import ErrorBoundary from "../ErrorBoundary";
import UserLocationMarker from "./UserLocationMarker";

const BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
// Map IDs are created free in Google Cloud → Map Management; DEMO_MAP_ID is for local testing only
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";

// Remembered per map (planner / each journey) for the whole visit, so changing the theme
// (which rebuilds the Google map) or changing page and coming back keeps the same view
const cameras = new globalThis.Map(); // (Map here is the Google map component)
const fittedRoute = new globalThis.Map();
const centred = new Set();
const followZoomed = new Set();
const LAYERS_KEY = "uos-map-layers";

const WALK_DOTS = [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }];

function stepStyle(step, mode) {
  if (step.travelMode === "WALK" && mode !== "walking") {
    return { strokeColor: "#6B7280", strokeOpacity: 0, strokeWeight: 4, icons: WALK_DOTS };
  }
  const color = step.transit?.color || MODE_META[mode]?.color || "#F57C00";
  return { strokeColor: color, strokeOpacity: 0.95, strokeWeight: 6 };
}

function FitToRoute({ points, enabled, mapKey }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !enabled || points.length < 2) return;
    const routeKey = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
    if (fittedRoute.get(mapKey) === routeKey) return; // already shown: keep the user's zoom
    fittedRoute.set(mapKey, routeKey);
    map.fitBounds(boundsOf(points), { top: 40, bottom: 40, left: 40, right: 40 });
  }, [map, points, enabled, mapKey]);
  return null;
}

function FollowUser({ position, following, onUserPan, zoom, mapKey }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return undefined;
    const listener = map.addListener("dragstart", () => onUserPan?.());
    return () => listener.remove();
  }, [map, onUserPan]);
  useEffect(() => {
    if (!map || !position || !following) return;
    if (!followZoomed.has(mapKey)) {
      map.setZoom(zoom);
      followZoomed.add(mapKey);
    }
    map.panTo(position);
  }, [map, position, following, zoom, mapKey]);
  return null;
}

// Shows the user's own area when the page opens, and again whenever "My location" is pressed
function CenterOnUser({ position, enabled, request, mapKey }) {
  const map = useMap();
  const lastRequest = useRef(request);
  useEffect(() => {
    if (!map || !position) return;
    const asked = request !== lastRequest.current;
    lastRequest.current = request;
    if (asked || (enabled && !centred.has(mapKey))) {
      centred.add(mapKey);
      map.panTo(position);
      if ((map.getZoom() ?? 0) < 15) map.setZoom(16);
    }
  }, [map, position, enabled, request, mapKey]);
  return null;
}

function MapLayers({ layers }) {
  const map = useMap();
  const instances = useRef({});
  const forMap = useRef(null);
  useEffect(() => {
    if (!map || !window.google?.maps) return;
    if (forMap.current !== map) {
      Object.values(instances.current).forEach((layer) => layer.setMap(null));
      instances.current = {};
      forMap.current = map;
    }
    const factories = {
      transit: () => new window.google.maps.TransitLayer(),
      bicycling: () => new window.google.maps.BicyclingLayer(),
      traffic: () => new window.google.maps.TrafficLayer(),
    };
    Object.entries(factories).forEach(([name, create]) => {
      if (layers[name]) {
        instances.current[name] ??= create();
        instances.current[name].setMap(map);
      } else {
        instances.current[name]?.setMap(null);
      }
    });
  }, [map, layers]);
  return null;
}

// Every bus reporting a live position inside the area on screen (any operator, across England)
function LiveVehicles({ onStatus, userPosition, ridingLine }) {
  const map = useMap();
  const [view, setView] = useState(null);
  const [projected, setProjected] = useState([]);
  const latest = useRef(new globalThis.Map());
  const previous = useRef(new globalThis.Map());
  useEffect(() => {
    if (!map) return undefined;
    const read = () => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      setView({ bounds: { west: sw.lng(), south: sw.lat(), east: ne.lng(), north: ne.lat() }, zoom: map.getZoom() });
    };
    read();
    const listener = map.addListener("idle", read);
    return () => listener.remove();
  }, [map]);

  const state = useAreaVehicles(view, true);
  const text = areaStatusText(state);
  useEffect(() => onStatus(text), [text, onStatus]);
  useEffect(() => () => onStatus(""), [onStatus]);

  // Remember each bus's previous report (to work out its speed), then move buses along every few seconds
  const vehicles = state.vehicles;
  useEffect(() => {
    vehicles.forEach((v) => {
      const key = `${v.operatorRef}-${v.vehicleRef}`;
      const at = Date.parse(v.recordedAt);
      const last = latest.current.get(key);
      if (last && last.at !== at) previous.current.set(key, last);
      latest.current.set(key, { lat: v.lat, lng: v.lng, at });
    });
    const update = () =>
      setProjected(vehicles.map((v) => projectVehicle(v, previous.current.get(`${v.operatorRef}-${v.vehicleRef}`))));
    update();
    if (!vehicles.length) return undefined;
    const timer = setInterval(update, 3000);
    return () => clearInterval(timer);
  }, [vehicles]);

  const shown = projected
    // The bus you're riding is where your own arrow is, so don't draw a second, lagging copy
    .filter((v) => !(ridingLine && userPosition && String(v.route).toLowerCase() === String(ridingLine).toLowerCase() && distanceMeters(userPosition, v) < 500))
    .slice(0, 400);

  return shown.map((v) => (
    <AdvancedMarker
      key={v.vehicleRef || `${v.operatorRef}-${v.route}-${v.lat}`}
      position={{ lat: v.lat, lng: v.lng }}
      title={`Bus ${v.route}${v.destination ? ` to ${v.destination}` : ""}`}
      zIndex={500}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
    >
      <span className="map-bus" aria-hidden="true">
        {Number.isFinite(v.bearing) && <span className="map-bus-arrow" style={{ transform: `rotate(${v.bearing}deg)` }} />}
        {v.route}
      </span>
    </AdvancedMarker>
  ));
}

function useInView(ref) {
  // Without IntersectionObserver support, just load the map straight away
  const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));
  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: "200px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, visible]);
  return visible;
}

// If Google Maps itself fails (key not allowed on this page, network, ...), only the map is
// replaced: route options and turn-by-turn directions keep working
export default function PlannerMap(props) {
  return (
    <ErrorBoundary
      fallback={(retry) => (
        <div className={`planner-map planner-map-fallback ${props.navigating ? "planner-map-nav" : ""}`} role="alert">
          <p>
            🗺️ The map couldn't load just now. Your directions still work.{" "}
            <button type="button" className="link-button" onClick={retry}>Try the map again</button>
          </p>
        </div>
      )}
    >
      <PlannerMapInner {...props} />
    </ErrorBoundary>
  );
}

function PlannerMapInner({
  origin,
  destination,
  option,
  userPosition,
  heading = null,
  compass,
  navigating = false,
  following = true,
  onUserPan,
  cycleParks = [],
  theme = "light",
  mapKey = "planner",
  ridingLine = null,
}) {
  const containerRef = useRef(null);
  const inView = useInView(containerRef);
  const [loadError, setLoadError] = useState("");
  const [layers, setLayers] = useState(() => ({ transit: false, bicycling: false, traffic: false, buses: false, ...readJSON(LAYERS_KEY, {}) }));
  const [recentre, setRecentre] = useState(0);
  const [busStatus, setBusStatus] = useState("");
  const camera = cameras.get(mapKey);

  useEffect(() => {
    writeJSON(LAYERS_KEY, layers);
  }, [layers]);

  useEffect(() => {
    // Google calls this global when the browser key is rejected (wrong referrer, billing off, ...)
    window.gm_authFailure = () => setLoadError("The map couldn't load because of a Google Maps key problem.");
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const routePoints = useMemo(() => {
    if (option?.polyline) return decodePolyline(option.polyline);
    return [origin, destination].filter(Boolean);
  }, [option, origin, destination]);

  const showCycleParks = option?.mode === "cycling" && cycleParks.length > 0;

  if (!BROWSER_KEY) {
    return (
      <div className="planner-map planner-map-fallback" ref={containerRef}>
        <p>🗺️ The live map will appear here once the Google Maps browser key is configured.</p>
      </div>
    );
  }

  return (
    <div className={`planner-map ${navigating ? "planner-map-nav" : ""}`} ref={containerRef}>
      {loadError ? (
        <div className="planner-map-fallback" role="alert">
          <p>🗺️ {loadError} Your route options and directions still work below.</p>
        </div>
      ) : inView ? (
        <APIProvider apiKey={BROWSER_KEY} language="en-GB" region="GB" onError={() => setLoadError("The map couldn't load. Check your connection.")}>
          <Map
            // A new map for each theme (Google can't change it on an existing map); the camera is restored
            key={theme}
            mapId={MAP_ID}
            colorScheme={theme === "dark" ? "DARK" : "LIGHT"}
            defaultCenter={camera?.center || origin || SUNDERLAND}
            defaultZoom={camera?.zoom ?? 13}
            defaultHeading={camera?.heading ?? 0}
            defaultTilt={camera?.tilt ?? 0}
            onCameraChanged={(e) =>
              cameras.set(mapKey, { center: e.detail.center, zoom: e.detail.zoom, heading: e.detail.heading, tilt: e.detail.tilt })
            }
            gestureHandling={navigating ? "greedy" : "cooperative"}
            // Two-finger twist rotates the map, two-finger drag up/down tilts it; the compass resets north
            headingInteractionEnabled
            tiltInteractionEnabled
            rotateControl
            mapTypeControl={!navigating}
            streetViewControl={false}
            fullscreenControl
            clickableIcons={false}
            reuseMaps
            style={{ width: "100%", height: "100%" }}
          >
            <MapLayers layers={layers} />
            <FitToRoute points={routePoints} enabled={!navigating} mapKey={mapKey} />
            <CenterOnUser position={userPosition} enabled={!navigating && !option} request={recentre} mapKey={mapKey} />
            {navigating && <FollowUser position={userPosition} following={following} onUserPan={onUserPan} zoom={17} mapKey={mapKey} />}
            {layers.buses && <LiveVehicles onStatus={setBusStatus} userPosition={userPosition} ridingLine={ridingLine} />}

            {option?.steps?.map((step, i) => (
              <Polyline key={`${option.mode}-${i}`} path={stepPath(step)} {...stepStyle(step, option.mode)} />
            ))}

            {origin && (
              <AdvancedMarker position={origin} title={`Start: ${origin.label}`}>
                <span className="map-pin map-pin-start" aria-hidden="true">A</span>
              </AdvancedMarker>
            )}
            {destination && (
              <AdvancedMarker position={destination} title={`Destination: ${destination.label}`}>
                <span className="map-pin map-pin-end" aria-hidden="true">B</span>
              </AdvancedMarker>
            )}
            {showCycleParks &&
              cycleParks.map((park) => (
                <AdvancedMarker key={park.id} position={{ lat: park.lat, lng: park.lng }} title={park.name}>
                  <span className="map-pin map-pin-cycle" aria-hidden="true">🅿️</span>
                </AdvancedMarker>
              ))}
            {userPosition && (
              <AdvancedMarker
                position={userPosition}
                title="You are here"
                zIndex={1000}
                anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
              >
                <UserLocationMarker heading={heading} />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      ) : (
        <div className="planner-map-fallback" aria-hidden="true" />
      )}

      {!loadError && inView && (userPosition || compass?.needsPermission) && (
        <div className="map-location-controls">
          {compass?.needsPermission && userPosition && (
            <button type="button" onClick={compass.requestPermission}>
              🧭 Show my direction
            </button>
          )}
          {userPosition && !navigating && (
            <button type="button" onClick={() => setRecentre((n) => n + 1)} aria-label="Centre the map on my location">
              ◎ My location
            </button>
          )}
        </div>
      )}

      {!loadError && inView && (
        <div className="map-layer-toggles" role="group" aria-label="Map layers">
          {[
            ["transit", "🚇 Transit"],
            ["bicycling", "🚲 Cycle lanes"],
            ["traffic", "🚦 Traffic"],
            ["buses", "🚌 Live buses"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={layers[key] ? "active" : ""}
              aria-pressed={layers[key]}
              onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!loadError && inView && layers.buses && busStatus && (
        <p className="map-bus-status" role="status" aria-live="polite">{busStatus}</p>
      )}
    </div>
  );
}
