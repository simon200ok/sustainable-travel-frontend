import { recordVisit } from "./api";
import { readJSON, writeJSON } from "./storage";

// Privacy-friendly visitor counting. This device remembers only the dates it was last counted;
// the server receives yes/no flags ("first visit today?") and keeps running totals.
// No cookies, IDs, IP addresses or browsing history are stored anywhere.
const KEY = "uos-usage";
const OPT_OUT_KEY = "uos-usage-optout";
const PAGES = new Set(["/", "/ticketing", "/zones", "/map", "/sustainability", "/contact", "/privacy", "/accessibility"]);

export const privacySignalOn = () => navigator.globalPrivacyControl === true;

export function usageOptedOut() {
  return privacySignalOn() || readJSON(OPT_OUT_KEY, false) === true;
}

export function setUsageOptOut(optOut) {
  writeJSON(OPT_OUT_KEY, optOut);
  if (optOut) {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // storage blocked: nothing stored anyway
    }
  }
}

const pad = (n) => String(n).padStart(2, "0");

// ISO 8601 week, e.g. "2026-W41" (matches the server's weeks)
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

export function countVisit(pathname) {
  if (import.meta.env.DEV || pathname.startsWith("/admin") || navigator.webdriver || usageOptedOut()) return;

  const now = new Date();
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const week = isoWeek(now);
  const month = day.slice(0, 7);
  const seen = readJSON(KEY, null);
  // If this browser can't store anything (e.g. some private windows), count the page view only,
  // so the same person isn't counted as "new" on every page
  const remembered = writeJSON(KEY, { day, week, month });
  const flags = remembered
    ? { newUser: !seen, newDay: seen?.day !== day, newWeek: seen?.week !== week, newMonth: seen?.month !== month }
    : {};
  const installed = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;

  recordVisit({ path: PAGES.has(pathname) ? pathname : "other", installed: Boolean(installed), ...flags }).catch(() => {});
}
