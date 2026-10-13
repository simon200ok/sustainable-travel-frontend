import { locationErrorInfo } from "../lib/geo";

export default function LocationNotice({ code, onRetry, onDismiss, stillBlocked = false, onReload }) {
  if (!code) return null;
  const { title, message } = locationErrorInfo(code);
  const canRetry = !["unsupported", "insecure"].includes(code);
  const blocked = code === "denied";
  return (
    <div className="notice notice-warning" role="alert">
      <span className="notice-icon" aria-hidden="true">📍</span>
      <div>
        <strong>{title}</strong>
        {blocked && stillBlocked && (
          <span className="notice-still-blocked" role="alert">
            Still blocked. Change the location setting for this site first (steps below), then try again.
          </span>
        )}
        {message}
        <div className="notice-actions">
          {canRetry && onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {blocked ? "I've allowed it. Try again" : "Try again"}
            </button>
          )}
          {blocked && onReload && (
            <button type="button" className="btn btn-ghost" onClick={onReload}>
              Reload page
            </button>
          )}
          {onDismiss && (
            <button type="button" className="btn btn-ghost" onClick={onDismiss}>
              Type a start point instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
