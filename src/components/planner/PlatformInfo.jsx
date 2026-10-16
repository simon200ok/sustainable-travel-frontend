import { useEffect, useState } from "react";
import { getPlatform } from "../../lib/api";
import { transitLabel } from "../../lib/format";

const REFRESH_MS = 60_000;
// Live departure boards cover trains that have just left up to about 2 hours ahead
const WINDOW_BEFORE_MS = 30 * 60_000;
const WINDOW_AHEAD_MS = 120 * 60_000;

/**
 * Platform for a train or Metro step, from National Rail's live departure boards.
 * Shows "check the departure screens" when there's no platform (yet), or for buses nothing at all.
 */
export default function PlatformInfo({ step }) {
  const t = step?.transit;
  const isRail = t && transitLabel(t.vehicleType) !== "Bus";
  // Where the train leaves from (the step starts at the departure station)
  const from = t?.departureStopLocation || step?.start;
  const departMs = Date.parse(t?.departureTime);
  const canLook = Boolean(isRail && from && Number.isFinite(departMs));
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!canLook) return undefined;
    let cancelled = false;
    let timer;
    async function load() {
      const now = Date.now();
      if (departMs < now - WINDOW_BEFORE_MS || departMs > now + WINDOW_AHEAD_MS) {
        setInfo({ status: "out-of-range" });
      } else {
        try {
          const data = await getPlatform({ lat: from.lat, lng: from.lng, depart: t.departureTime, to: step.end });
          if (!cancelled) setInfo(data);
        } catch {
          if (!cancelled) setInfo({ status: "error" });
        }
      }
      // Platforms are often announced shortly before departure, and can change
      if (!cancelled) timer = setTimeout(load, REFRESH_MS);
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canLook, from, departMs, t?.departureTime, step?.end]);

  if (!isRail) return null;
  if (info?.status === "ok" && info.cancelled) {
    return (
      <p className="platform-info platform-cancelled" role="alert">
        ⚠️ This {transitLabel(t.vehicleType).toLowerCase()} is cancelled. Check the station screens or search again.
        <span className="platform-credit">Powered by National Rail Enquiries</span>
      </p>
    );
  }
  if (info?.status === "ok" && info.platform) {
    return (
      <p className="platform-info">
        <span className="platform-chip">Platform {info.platform}</span>
        {info.expected && <span className="platform-late"> Expected {info.expected}</span>}
        <span className="platform-credit">Powered by National Rail Enquiries</span>
      </p>
    );
  }
  return (
    <p className="platform-info platform-unknown">
      {info === null && canLook ? "Platform: checking…" : "Platform: check the departure screens at the station."}
      {info?.status === "ok" && info.expected && <span className="platform-late"> Expected {info.expected}</span>}
    </p>
  );
}
