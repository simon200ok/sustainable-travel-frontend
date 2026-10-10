import { useEffect, useState } from "react";
import { Polyline, useMap } from "@vis.gl/react-google-maps";
import { getCycleways } from "../../lib/api";

// Same tiles as the server (map_layers.py)
const TILE_LNG = 0.04;
const TILE_LAT = 0.025;
const MIN_ZOOM = 13;
const MAX_TILES = 12;
const RETRY_MS = 30_000;
const MAX_TRIES = 3;

// Kept for the whole visit, so panning back and forth doesn't reload anything
const loaded = new globalThis.Map(); // "x,y" -> lines
const failures = new globalThis.Map(); // "x,y" -> { tries, at }

// Clear on both light and dark maps: deep green on light, bright green on dark
const STYLE = {
  light: { track: { strokeColor: "#1B5E20", strokeWeight: 4 }, lane: { strokeColor: "#2E7D32", strokeWeight: 3, strokeOpacity: 0.85 } },
  dark: { track: { strokeColor: "#69F0AE", strokeWeight: 4 }, lane: { strokeColor: "#A5D6A7", strokeWeight: 3, strokeOpacity: 0.85 } },
};

function tilesInView(map) {
  const b = map.getBounds();
  if (!b) return [];
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  const tiles = [];
  for (let x = Math.floor(sw.lng() / TILE_LNG); x <= Math.floor(ne.lng() / TILE_LNG); x += 1) {
    for (let y = Math.floor(sw.lat() / TILE_LAT); y <= Math.floor(ne.lat() / TILE_LAT); y += 1) tiles.push(`${x},${y}`);
  }
  return tiles.slice(0, MAX_TILES);
}

/**
 * Cycle tracks and lanes from OpenStreetMap, drawn by the app. (Google's own bicycling layer
 * switches the map to a light style, even in dark mode.) Only the tiles on screen are loaded.
 */
export default function CycleLanes({ theme, onStatus }) {
  const map = useMap();
  const [tiles, setTiles] = useState([]);
  const [zoomedOut, setZoomedOut] = useState(false);
  const [, setVersion] = useState(0); // re-draw when a tile arrives

  useEffect(() => {
    if (!map) return undefined;
    const read = () => {
      const tooFar = (map.getZoom() ?? 0) < MIN_ZOOM;
      setZoomedOut(tooFar);
      setTiles(tooFar ? [] : tilesInView(map));
    };
    read();
    const listener = map.addListener("idle", read);
    return () => listener.remove();
  }, [map]);

  useEffect(() => {
    let cancelled = false;
    let timer;
    async function load() {
      const missing = tiles.filter((key) => {
        if (loaded.has(key)) return false;
        const failed = failures.get(key);
        return !failed || (failed.tries < MAX_TRIES && Date.now() - failed.at >= RETRY_MS);
      });
      await Promise.all(missing.map(async (key) => {
        const [x, y] = key.split(",").map(Number);
        try {
          const data = await getCycleways(x, y);
          loaded.set(key, data.lines);
          failures.delete(key);
        } catch {
          const failed = failures.get(key);
          failures.set(key, { tries: (failed?.tries ?? 0) + 1, at: Date.now() });
        }
      }));
      if (cancelled) return;
      setVersion((v) => v + 1);
      // OpenStreetMap's free servers are sometimes busy: try failed tiles again a little later
      if (tiles.some((key) => !loaded.has(key) && (failures.get(key)?.tries ?? 0) < MAX_TRIES)) timer = setTimeout(load, RETRY_MS);
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tiles]);

  const waiting = tiles.filter((key) => !loaded.has(key)).length;
  const status = zoomedOut
    ? "🔍 Zoom in to see cycle lanes."
    : waiting
      ? waiting === tiles.length
        ? "Loading cycle lanes…"
        : "Some cycle lanes are still loading…"
      : "🚲 Cycle lanes © OpenStreetMap contributors";
  useEffect(() => onStatus(status), [status, onStatus]);
  useEffect(() => () => onStatus(""), [onStatus]);

  const style = STYLE[theme === "dark" ? "dark" : "light"];
  return tiles.flatMap((key) =>
    (loaded.get(key) || []).map((line, i) => (
      <Polyline
        key={`${key}-${i}`}
        path={line.points.map(([lat, lng]) => ({ lat, lng }))}
        clickable={false}
        zIndex={2}
        {...style[line.kind === "track" ? "track" : "lane"]}
      />
    )),
  );
}
