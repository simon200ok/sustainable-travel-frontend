import { useEffect, useMemo, useRef, useState } from "react";
import { planJourney } from "../lib/api";
import { distanceMeters } from "../lib/geo";
import { describeStep, distanceToPath, stepPath } from "../lib/navigation";
import { speak, spokenDistance } from "../lib/speech";

const ARRIVE_RADIUS_M = 35;
const PRE_ANNOUNCE_M = 120;
const OFF_ROUTE_FIXES = 3;
const REROUTE_COOLDOWN_MS = 45_000;
const VEHICLE_SPEED = 4.5; // m/s (~16 km/h): faster than anyone walks, so you're on a vehicle
const TRANSIT_TOLERANCE_M = 100; // timetable shapes are rough, and GPS on a bus wanders
// Typical speeds, used to time the "get off soon" alerts when GPS speed isn't available yet
const TYPICAL_SPEED = { bus: 6, metro: 11, train: 18 };
const RAIL = new Set(["SUBWAY", "METRO_RAIL", "LIGHT_RAIL", "TRAM", "MONORAIL", "RAIL", "HEAVY_RAIL", "COMMUTER_TRAIN", "HIGH_SPEED_TRAIN", "LONG_DISTANCE_TRAIN"]);

function advanceRadius(step, accuracy) {
  if (step.transit) return 120; // you're on a vehicle: switch when near the alighting stop
  return Math.max(25, Math.min(accuracy || 0, 40));
}

function vehicleKind(step) {
  const type = step.transit?.vehicleType || "";
  if (!RAIL.has(type)) return "bus";
  return ["SUBWAY", "METRO_RAIL", "LIGHT_RAIL", "TRAM", "MONORAIL"].includes(type) ? "metro" : "train";
}

function vibrate() {
  try {
    navigator.vibrate?.([400, 200, 400]);
  } catch {
    // Not supported (e.g. iPhone): the spoken and on-screen alerts still happen
  }
}

/** Live guidance: tracks progress along `option.steps`, speaks instructions and estimates arrival. */
export function useTurnByTurn({ option, destination, position, voiceOn, onReroute, onArrive }) {
  const steps = option.steps;
  const paths = useMemo(() => steps.map(stepPath), [steps]);
  const [index, setIndex] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [alightAlert, setAlightAlert] = useState("");
  const [speed, setSpeed] = useState(null);
  const announced = useRef(new Set());
  const offCount = useRef(0);
  const lastReroute = useRef(0);
  const synced = useRef(false);
  const samples = useRef([]);
  const voice = useRef(voiceOn);
  voice.current = voiceOn;

  const say = (key, text, { buzz = false } = {}) => {
    if (announced.current.has(key)) return;
    announced.current.add(key);
    if (buzz) vibrate();
    if (voice.current) speak(text);
  };

  // New route (initial or after re-routing): start from the first step
  useEffect(() => {
    setIndex(0);
    setOffRoute(false);
    setAlightAlert("");
    announced.current = new Set();
    offCount.current = 0;
    synced.current = false;
    if (steps[0]) say("0:start", `Starting ${option.label.toLowerCase()} directions. ${describeStep(steps[0])}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option]);

  // Smoothed speed over the last ~20 seconds (GPS speed is often missing or jumpy)
  useEffect(() => {
    if (!position) return;
    const now = position.at || Date.now();
    samples.current = [...samples.current.filter((s) => now - s.at < 20_000), { lat: position.lat, lng: position.lng, at: now }];
    const first = samples.current[0];
    const seconds = (now - first.at) / 1000;
    const measured = seconds >= 4 ? distanceMeters(first, position) / seconds : null;
    const reported = Number.isFinite(position.speed) && position.speed >= 0 ? position.speed : null;
    setSpeed(reported != null && measured != null ? (reported + measured) / 2 : reported ?? measured);
  }, [position]);

  useEffect(() => {
    if (!position || arrived || !steps.length) return;
    const moving = speed ?? 0;

    if (destination && distanceMeters(position, destination) < ARRIVE_RADIUS_M) {
      setArrived(true);
      setAlightAlert("");
      if (voice.current) speak(`You have arrived at ${destination.label}.`);
      onArrive?.();
      return;
    }

    // First fix on this route: if the user is already part-way along (e.g. the page was
    // reloaded mid-journey), start from the step they're actually on
    if (!synced.current) {
      synced.current = true;
      const tolerance = Math.max(60, (position.accuracy || 0) * 1.5);
      if (distanceToPath(position, paths[0]) > tolerance) {
        let best = 0;
        paths.forEach((p, k) => {
          if (distanceToPath(position, p) < distanceToPath(position, paths[best])) best = k;
        });
        if (best > 0 && distanceToPath(position, paths[best]) <= (steps[best].transit ? TRANSIT_TOLERANCE_M : tolerance)) {
          setIndex(best);
          say(`${best}:start`, describeStep(steps[best]));
          return;
        }
      }
    }

    // Move forward through steps the user has completed (or skipped)
    let i = index;
    while (i < steps.length - 1) {
      const step = steps[i];
      const nextStep = steps[i + 1];
      const toNext = distanceToPath(position, paths[i + 1]);
      const atEnd = step.end && distanceMeters(position, step.end) < advanceRadius(step, position.accuracy);
      const onNext = toNext < (nextStep.transit ? 60 : 15) && distanceToPath(position, paths[i]) > 30;
      // Moving at vehicle speed near the bus/Metro line = you've boarded (even if it came late)
      const boarded = nextStep.transit && !step.transit && moving > VEHICLE_SPEED && toNext < 150;
      if (!atEnd && !onNext && !boarded) break;
      i += 1;
    }
    if (i !== index) {
      setIndex(i);
      setOffRoute(false);
      offCount.current = 0;
      if (!steps[i].transit) setAlightAlert("");
      say(`${i}:start`, describeStep(steps[i]));
      return;
    }

    const step = steps[index];
    const next = steps[index + 1];

    // On a bus / Metro / train: warn about 3 minutes and 1 minute before the stop to get off at
    if (step.transit && step.end) {
      const remaining = distanceMeters(position, step.end);
      const kind = vehicleKind(step);
      const typical = TYPICAL_SPEED[kind];
      const secondsLeft = moving > 2 ? remaining / moving : null;
      const stop = step.transit.arrivalStop || "your stop";
      const bell = kind === "bus";
      if ((secondsLeft != null && secondsLeft <= 70) || remaining <= typical * 55) {
        setAlightAlert(`🔔 Get off at ${stop} in about 1 minute${bell ? " — press the bell" : ""}`);
        say(`${index}:alight1`, `Get ready to get off. ${stop} is in about 1 minute.${bell ? " Press the bell now." : ""}`, { buzz: true });
      } else if ((secondsLeft != null && secondsLeft <= 190) || remaining <= typical * 150) {
        setAlightAlert(`🚏 Get off at ${stop} in about 3 minutes`);
        say(`${index}:alight3`, `In about 3 minutes, get off at ${stop}.${bell ? " Press the bell when you're close." : ""}`, { buzz: true });
      }
      setOffRoute(false);
      offCount.current = 0;
      return; // never "off route" while riding
    }

    const toEnd = step.end ? distanceMeters(position, step.end) : Infinity;
    if (next && toEnd < PRE_ANNOUNCE_M && toEnd > 30) {
      say(`${index}:near`, `In ${spokenDistance(toEnd)}, ${describeStep(next)}`);
    }

    // Off-route detection: near the current or next step, or any bus/Metro line still ahead, is fine
    const remainingTransit = steps.some((s, k) => k > index && s.transit);
    const nearest = Math.min(
      distanceToPath(position, paths[index]),
      next ? distanceToPath(position, paths[index + 1]) : Infinity,
    );
    const nearTransitAhead = steps.some((s, k) => k > index && s.transit && distanceToPath(position, paths[k]) < TRANSIT_TOLERANCE_M);
    const tolerance = Math.max(50, (position.accuracy || 0) * 1.5);
    const onAVehicle = remainingTransit && moving > VEHICLE_SPEED;
    const off = nearest > tolerance && !nearTransitAhead && !onAVehicle;
    offCount.current = off ? offCount.current + 1 : 0;
    setOffRoute(offCount.current >= OFF_ROUTE_FIXES);

    const canReroute = Date.now() - lastReroute.current > REROUTE_COOLDOWN_MS && navigator.onLine;
    if (offCount.current >= OFF_ROUTE_FIXES && canReroute && destination) {
      lastReroute.current = Date.now();
      setRerouting(true);
      if (voice.current) speak("You're off the route. Finding a new route.");
      planJourney({ label: "Your location", lat: position.lat, lng: position.lng }, destination)
        .then((result) => {
          // Same way of travelling if possible, otherwise the one that arrives first
          const same = result.options.find((o) => o.mode === option.mode)
            || [...result.options].sort((a, b) => Date.parse(a.arriveAt) - Date.parse(b.arriveAt))[0];
          if (same) onReroute?.(same);
        })
        .catch(() => {
          if (voice.current) speak("Couldn't get a new route. Follow the map back to the blue line.");
        })
        .finally(() => setRerouting(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const step = steps[index];
  const distanceToStepEnd = position && step?.end ? distanceMeters(position, step.end) : null;
  const eta = useMemo(
    () => estimateArrival(steps, index, distanceToStepEnd, speed),
    [steps, index, distanceToStepEnd, speed],
  );

  return {
    index,
    step,
    next: steps[index + 1],
    distanceToStepEnd,
    offRoute,
    rerouting,
    arrived,
    alightAlert,
    eta,
    goTo: (i) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, i));
      setIndex(clamped);
      if (voice.current) speak(describeStep(steps[clamped]));
    },
  };
}

/**
 * Live arrival time: what's left of the current step, then the remaining steps. A bus, Metro or
 * train not yet boarded can't leave before its timetable; if you're late for it, the time moves too.
 */
export function estimateArrival(steps, index, distanceToStepEnd, speed, nowMs = Date.now()) {
  let t = nowMs;
  for (let k = index; k < steps.length; k += 1) {
    const s = steps[k];
    const planned = (s.durationSeconds || s.distanceMeters / 1.3) * 1000;
    const fraction = k === index && distanceToStepEnd != null && s.distanceMeters
      ? Math.min(1, distanceToStepEnd / s.distanceMeters)
      : 1;
    if (s.transit) {
      const dep = Date.parse(s.transit.departureTime);
      const arr = Date.parse(s.transit.arrivalTime);
      const ride = Number.isFinite(dep) && Number.isFinite(arr) && arr > dep ? arr - dep : planned;
      if (k === index) {
        // On board: use the real speed when we have it
        t += speed > 2 && distanceToStepEnd != null ? (distanceToStepEnd / speed) * 1000 : ride * fraction;
      } else {
        t = Math.max(t, Number.isFinite(dep) ? dep : t) + ride;
      }
    } else {
      t += planned * fraction;
    }
  }
  return new Date(t);
}
