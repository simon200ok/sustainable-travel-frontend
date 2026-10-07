import { readJSON, writeJSON } from "./storage";

/*
 * Leave-by reminders.
 * - While the app/tab is open (or the installed app is in the background on Android),
 *   a timer fires a notification + in-app alert.
 * - Browsers can't wake a closed web app at an exact time, so we also offer
 *   "Add to calendar" (.ics with an alarm), which works on every phone.
 */
const KEY = "uos-reminders";
const timers = new Map();

export const notificationsSupported = () => "Notification" in window;

export async function ensureNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

async function fire(reminder) {
  window.dispatchEvent(new CustomEvent("uos-reminder", { detail: reminder }));
  navigator.vibrate?.([200, 100, 200]);
  if (notificationsSupported() && Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(reminder.title, { body: reminder.body, tag: reminder.id, icon: "/icons/icon-192.png" });
      } else {
        new Notification(reminder.title, { body: reminder.body, tag: reminder.id });
      }
    } catch {
      // In-app alert already shown
    }
  }
  cancelReminder(reminder.id);
}

function arm(reminder) {
  clearTimeout(timers.get(reminder.id));
  const delay = new Date(reminder.at).getTime() - Date.now();
  if (delay < -60_000) return false; // already passed
  timers.set(reminder.id, setTimeout(() => fire(reminder), Math.max(0, delay)));
  return true;
}

export function scheduleReminder(reminder) {
  const all = readJSON(KEY, []).filter((r) => r.id !== reminder.id);
  if (!arm(reminder)) return false;
  writeJSON(KEY, [...all, reminder]);
  return true;
}

export function cancelReminder(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  writeJSON(KEY, readJSON(KEY, []).filter((r) => r.id !== id));
}

export function hasReminder(id) {
  return readJSON(KEY, []).some((r) => r.id === id);
}

// Re-arm timers after a reload
export function restoreReminders() {
  const live = readJSON(KEY, []).filter((r) => arm(r));
  writeJSON(KEY, live);
}

function icsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(text) {
  return String(text).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function downloadCalendarReminder({ id, title, body, leaveAt, minutesBefore = 5 }) {
  const start = new Date(leaveAt);
  const end = new Date(start.getTime() + 10 * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UoS Sustainable Travel Hub//EN",
    "BEGIN:VEVENT",
    `UID:${icsEscape(id)}@uos-sustainable-travel`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(body)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(title)}`,
    `TRIGGER:-PT${minutesBefore}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "leave-reminder.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
