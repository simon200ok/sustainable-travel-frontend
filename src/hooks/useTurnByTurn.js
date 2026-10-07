import { useEffect, useMemo, useRef, useState } from "react";
import { planJourney } from "../lib/api";
import { distanceMeters } from "../lib/geo";
import { describeStep, distanceToPath, stepPath } from "../lib/navigation";
import { speak, spokenDistance } from "../lib/speech";

const ARRIVE_RADIUS_M = 35;
const PRE_ANNOUNCE_M = 120;
const OFF_ROUTE_FIXES = 3;
const REROUTE_COOLDOWN_MS = 45_000;

function advanceRadius(step, accuracy) {
  if (step.transit) return 120; // you're on a vehicle: switch when near the alighting stop
  return Math.max(25, Math.min(accuracy || 0, 40));
}

/** Live guidance: tracks progress along `option.steps` and speaks instructions. */
export function useTurnByTurn({ option, destination, position, voiceOn, onReroute, onArrive }) {
  const steps = option.steps;
  const paths = useMemo(() => steps.map(stepPath), [steps]);
  const [index, setIndex] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [arrived, setArrived] = useState(false);
  const announced = useRef(new Set());
  const offCount = useRef(0);
  const lastReroute = useRef(0);
  const voice = useRef(voiceOn);
  voice.current = voiceOn;

  const say = (key, text) => {
    if (announced.current.has(key)) return;
    announced.current.add(key);
    if (voice.current) speak(text);
  };

  // New route (initial or after re-routing): start from the first step
  useEffect(() => {
    setIndex(0);
    setOffRoute(false);
    announced.current = new Set();
    offCount.current = 0;
    if (steps[0]) say("0:start", `Starting ${option.label.toLowerCase()} directions. ${describeStep(steps[0])}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option]);

  useEffect(() => {
    if (!position || arrived || !steps.length) return;

    if (destination && distanceMeters(position, destination) < ARRIVE_RADIUS_M) {
      setArrived(true);
      if (voice.current) speak(`You have arrived at ${destination.label}.`);
      onArrive?.();
      return;
    }

    // Move forward through steps the user has completed (or skipped)
    let i = index;
    while (i < steps.length - 1) {
      const step = steps[i];
      const atEnd = step.end && distanceMeters(position, step.end) < advanceRadius(step, position.accuracy);
      const onNext = distanceToPath(position, paths[i + 1]) < 15 && distanceToPath(position, paths[i]) > 30;
      if (!atEnd && !onNext) break;
      i += 1;
    }
    if (i !== index) {
      setIndex(i);
      say(`${i}:start`, describeStep(steps[i]));
      return;
    }

    const step = steps[index];
    const next = steps[index + 1];
    const toEnd = step.end ? distanceMeters(position, step.end) : Infinity;
    if (next && !step.transit && toEnd < PRE_ANNOUNCE_M && toEnd > 30) {
      say(`${index}:near`, `In ${spokenDistance(toEnd)}, ${describeStep(next)}`);
    }

    // Off-route detection (not while riding a bus/Metro/train)
    if (!step.transit) {
      const nearest = Math.min(distanceToPath(position, paths[index]), next ? distanceToPath(position, paths[index + 1]) : Infinity);
      const tolerance = Math.max(50, (position.accuracy || 0) * 1.5);
      offCount.current = nearest > tolerance ? offCount.current + 1 : 0;
      setOffRoute(offCount.current >= OFF_ROUTE_FIXES);

      const canReroute = Date.now() - lastReroute.current > REROUTE_COOLDOWN_MS && navigator.onLine;
      if (offCount.current >= OFF_ROUTE_FIXES && canReroute && destination) {
        lastReroute.current = Date.now();
        setRerouting(true);
        if (voice.current) speak("You're off the route. Finding a new route.");
        planJourney({ label: "Your location", lat: position.lat, lng: position.lng }, destination)
          .then((result) => {
            const same = result.options.find((o) => o.mode === option.mode) || result.options[0];
            if (same) onReroute?.(same);
          })
          .catch(() => {
            if (voice.current) speak("Couldn't get a new route. Follow the map back to the blue line.");
          })
          .finally(() => setRerouting(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const step = steps[index];
  const distanceToStepEnd = position && step?.end ? distanceMeters(position, step.end) : null;

  return {
    index,
    step,
    next: steps[index + 1],
    distanceToStepEnd,
    offRoute,
    rerouting,
    arrived,
    goTo: (i) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, i));
      setIndex(clamped);
      if (voice.current) speak(describeStep(steps[clamped]));
    },
  };
}
