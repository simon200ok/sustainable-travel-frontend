import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "./storage";

// The visitor's privacy choices, kept on this device only.
// Nothing optional (maps from Google or OpenStreetMap, anonymous visit counting) runs until
// the visitor has said yes to it. Saying nothing counts as no.
const KEY = "uos-privacy-choices";
const OLD_OPT_OUT_KEY = "uos-usage-optout"; // the earlier "Don't count my visits" switch
const USAGE_KEY = "uos-usage";
const EVENT = "uos-privacy-choices";

// Browsers with a Global Privacy Control signal are never counted
export const privacySignalOn = () => navigator.globalPrivacyControl === true;

export function getChoices() {
  const saved = readJSON(KEY, null);
  return {
    // Answered the privacy question (banner or Privacy page). Only switching maps on from a map
    // doesn't count, so the banner still asks about visit counting.
    decided: Boolean(saved) && saved.answered !== false,
    maps: saved?.maps === true,
    stats: saved?.stats === true && !privacySignalOn(),
  };
}

/** `answered: false` = changed from a map's "Show maps" button, without answering the banner. */
export function saveChoices({ maps, stats }, { answered = true } = {}) {
  const next = { maps: Boolean(maps), stats: Boolean(stats) && !privacySignalOn(), answered, at: new Date().toISOString() };
  writeJSON(KEY, next);
  try {
    window.localStorage.removeItem(OLD_OPT_OUT_KEY);
    // Counting switched off: forget the dates this browser was counted
    if (!next.stats) window.localStorage.removeItem(USAGE_KEY);
  } catch {
    // storage blocked: nothing was stored anyway
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The current choices, updated when they change (on this page, or in another tab). */
export function usePrivacyChoices() {
  const [choices, setChoices] = useState(getChoices);
  useEffect(() => {
    const update = () => setChoices(getChoices());
    const onStorage = (e) => (e.key === KEY || e.key === null) && update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return choices;
}
