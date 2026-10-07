import { useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, AdvancedMarker, Map, Polyline, useMap } from "@vis.gl/react-google-maps";
import { MODE_META } from "../../lib/format";
import { SUNDERLAND } from "../../lib/geo";
import { boundsOf, decodePolyline, stepPath } from "../../lib/navigation";

const BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
// Map IDs are created free in Google Cloud → Map Management; DEMO_MAP_ID is for local testing only
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";

const WALK_DOTS = [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }];

function stepStyle(step, mode) {
  if (step.travelMode === "WALK" && mode !== "walking") {
    return { strokeColor: "#6B7280", strokeOpacity: 0, strokeWeight: 4, icons: WALK_DOTS };
  }
  const color = step.transit?.color || MODE_META[mode]?.color || "#F57C00";
  return { strokeColor: color, strokeOpacity: 0.95, strokeWeight: 6 };
}

function FitToRoute({ points, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !enabled || points.length < 2) return;
    const b = boundsOf(points);
    map.fitBounds(b, { top: 40, bottom: 40, left: 40, right: 40 });
  }, [map, points, enabled]);
  return null;
}

function FollowUser({ position, following, onUserPan, zoom }) {
  const map = useMap();
  const started = useRef(false);
  useEffect(() => {
    if (!map) return undefined;
    const listener = map.addListener("dragstart", () => onUserPan?.());
    return () => listener.remove();
  }, [map, onUserPan]);
  useEffect(() => {
    if (!map || !position || !following) return;
    if (!started.current) {
      map.setZoom(zoom);
      started.current = true;
    }
    map.panTo(position);
  }, [map, position, following, zoom]);
  return null;
}

function MapLayers({ layers }) {
  const map = useMap();
  const instances = useRef({});
  useEffect(() => {
    if (!map || !window.google?.maps) return;
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

export default function PlannerMap({
  origin,
  destination,
  option,
  userPosition,
  navigating = false,
  following = true,
  onUserPan,
  cycleParks = [],
  theme = "light",
}) {
  const containerRef = useRef(null);
  const inView = useInView(containerRef);
  const [loadError, setLoadError] = useState("");
  const [layers, setLayers] = useState({ transit: false, bicycling: false, traffic: false });

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
            mapId={MAP_ID}
            colorScheme={theme === "dark" ? "DARK" : "LIGHT"}
            defaultCenter={origin || SUNDERLAND}
            defaultZoom={13}
            gestureHandling={navigating ? "greedy" : "cooperative"}
            mapTypeControl={!navigating}
            streetViewControl={false}
            fullscreenControl
            clickableIcons={false}
            reuseMaps
            style={{ width: "100%", height: "100%" }}
          >
            <MapLayers layers={layers} />
            <FitToRoute points={routePoints} enabled={!navigating} />
            {navigating && <FollowUser position={userPosition} following={following} onUserPan={onUserPan} zoom={17} />}

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
              <AdvancedMarker position={userPosition} title="You are here" zIndex={1000}>
                <span className="map-user-dot" aria-hidden="true" />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      ) : (
        <div className="planner-map-fallback" aria-hidden="true" />
      )}

      {!loadError && inView && (
        <div className="map-layer-toggles" role="group" aria-label="Map layers">
          {[
            ["transit", "🚇 Transit"],
            ["bicycling", "🚲 Cycle lanes"],
            ["traffic", "🚦 Traffic"],
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
    </div>
  );
}
