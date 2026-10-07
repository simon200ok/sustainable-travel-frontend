import { useEffect, useState } from "react";
import { formatTime, minutesUntil, transitLabel } from "../../lib/format";
import {
  cancelReminder,
  downloadCalendarReminder,
  ensureNotificationPermission,
  hasReminder,
  scheduleReminder,
} from "../../lib/reminders";

const REMIND_BEFORE_MIN = 5;

export default function LeaveByAlert({ option }) {
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const transit = option.firstTransit;
  const reminderId = transit ? `${transit.line}-${transit.stop}-${transit.departureTime}` : null;
  const [armed, setArmed] = useState(() => (reminderId ? hasReminder(reminderId) : false));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!transit || !option.leaveBy) return null;

  const leaveIn = minutesUntil(option.leaveBy, now);
  const vehicle = transitLabel(transit.vehicleType).toLowerCase();
  const service = transit.line ? `the ${transit.line}` : `your ${vehicle}`;
  const title = `Leave now to catch ${service}`;
  const body = `${service} departs ${transit.stop} at ${formatTime(transit.departureTime)}.`;

  let headline;
  let tone = "info";
  if (leaveIn <= 0) {
    headline = minutesUntil(transit.departureTime, now) > 0 ? `Leave now to catch ${service}` : `${service} has probably left — search again for the next one`;
    tone = "error";
  } else if (leaveIn <= REMIND_BEFORE_MIN) {
    headline = `Leave in ${leaveIn} min to catch ${service}`;
    tone = "warning";
  } else {
    headline = `Leave by ${formatTime(option.leaveBy)} (in ${leaveIn} min) to catch ${service}`;
  }

  async function toggleReminder() {
    if (armed) {
      cancelReminder(reminderId);
      setArmed(false);
      setMessage("Reminder cancelled.");
      return;
    }
    const permission = await ensureNotificationPermission();
    const at = new Date(new Date(option.leaveBy).getTime() - REMIND_BEFORE_MIN * 60_000).toISOString();
    const ok = scheduleReminder({ id: reminderId, at, title: `Leave in ${REMIND_BEFORE_MIN} min`, body });
    setArmed(ok);
    if (!ok) setMessage("It's too late for a reminder — head off now.");
    else if (permission === "granted") setMessage(`We'll notify you at ${formatTime(at)}. Keep the app open in the background.`);
    else setMessage(`We'll alert you in the app at ${formatTime(at)}. Notifications are blocked, so use “Add to calendar” for a phone alarm.`);
  }

  return (
    <div className={`notice notice-${tone} leave-by`} role="status" aria-live="polite">
      <span className="notice-icon" aria-hidden="true">⏰</span>
      <div>
        <strong>{headline}</strong>
        Departs {transit.stop} at {formatTime(transit.departureTime)}
        {transit.walkSeconds > 60 && ` · ${Math.round(transit.walkSeconds / 60)} min walk to the stop`}
        {leaveIn > 0 && (
          <div className="notice-actions">
            {leaveIn > REMIND_BEFORE_MIN && (
              <button type="button" className="btn btn-ghost" onClick={toggleReminder}>
                {armed ? "🔕 Cancel reminder" : `🔔 Remind me ${REMIND_BEFORE_MIN} min before`}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadCalendarReminder({ id: reminderId, title, body, leaveAt: option.leaveBy, minutesBefore: REMIND_BEFORE_MIN })}
            >
              📅 Add to calendar
            </button>
          </div>
        )}
        {message && <p className="leave-by-message">{message}</p>}
      </div>
    </div>
  );
}
