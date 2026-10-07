import { useCallback, useEffect, useRef, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";

const GRANTED_KEY = "uos-compass-granted";
const MIN_CHANGE_DEG = 3;
const MIN_INTERVAL_MS = 100;

const needsIosPermission = () =>
  typeof window.DeviceOrientationEvent !== "undefined" &&
  typeof window.DeviceOrientationEvent.requestPermission === "function";

function screenAngle() {
  return window.screen?.orientation?.angle ?? window.orientation ?? 0;
}

// Direction the back of the phone points when it's held upright (W3C DeviceOrientation spec)
function tiltCompensatedHeading(alpha, beta, gamma) {
  const rad = Math.PI / 180;
  const x = beta * rad;
  const y = gamma * rad;
  const z = alpha * rad;
  const vx = -Math.cos(z) * Math.sin(y) - Math.sin(z) * Math.sin(x) * Math.cos(y);
  const vy = -Math.sin(z) * Math.sin(y) + Math.cos(z) * Math.sin(x) * Math.cos(y);
  let heading = Math.atan(vx / vy);
  if (vy < 0) heading += Math.PI;
  else if (vx < 0) heading += 2 * Math.PI;
  return heading / rad;
}

function headingFromEvent(e) {
  let heading = null;
  if (typeof e.webkitCompassHeading === "number" && !Number.isNaN(e.webkitCompassHeading)) {
    heading = e.webkitCompassHeading; // iOS: already tilt-compensated, relative to the top of the phone
  } else if (e.absolute && e.alpha != null) {
    heading = Math.abs(e.beta ?? 0) > 45 ? tiltCompensatedHeading(e.alpha, e.beta, e.gamma ?? 0) : 360 - e.alpha;
  }
  if (heading == null || Number.isNaN(heading)) return null;
  return (heading + screenAngle() + 360) % 360;
}

const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/**
 * Which way the phone is facing (0 = north, 90 = east), from the compass.
 * iPhones need a one-off permission tap; desktops have no compass, so heading stays null.
 */
export function useDeviceHeading() {
  const [heading, setHeading] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(() => needsIosPermission() && !readJSON(GRANTED_KEY, false));
  const [listening, setListening] = useState(() => !needsIosPermission());
  const last = useRef({ value: null, at: 0 });

  useEffect(() => {
    if (!listening) return undefined;
    const onOrientation = (e) => {
      const next = headingFromEvent(e);
      if (next == null) return;
      const now = performance.now();
      const prev = last.current;
      if (prev.value != null && (angleDiff(prev.value, next) < MIN_CHANGE_DEG || now - prev.at < MIN_INTERVAL_MS)) return;
      last.current = { value: next, at: now };
      setHeading(next);
    };
    const eventName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, onOrientation);
    return () => window.removeEventListener(eventName, onOrientation);
  }, [listening]);

  const requestPermission = useCallback(async () => {
    if (!needsIosPermission()) {
      setListening(true);
      return true;
    }
    try {
      const result = await window.DeviceOrientationEvent.requestPermission();
      const granted = result === "granted";
      writeJSON(GRANTED_KEY, granted);
      setNeedsPermission(!granted);
      setListening(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  // iPhone users who allowed the compass before: it switches back on with their first tap
  useEffect(() => {
    if (!needsIosPermission() || !readJSON(GRANTED_KEY, false)) return undefined;
    const onFirstTap = () => requestPermission();
    document.addEventListener("click", onFirstTap, { once: true });
    return () => document.removeEventListener("click", onFirstTap);
  }, [requestPermission]);

  return { heading, needsPermission, requestPermission };
}
