import { locationErrorInfo } from "../lib/geo";

export default function LocationNotice({ code, onRetry, onDismiss }) {
  if (!code) return null;
  const { title, message } = locationErrorInfo(code);
  const canRetry = !["unsupported", "insecure"].includes(code);
  return (
    <div className="notice notice-warning" role="alert">
      <span className="notice-icon" aria-hidden="true">📍</span>
      <div>
        <strong>{title}</strong>
        {message}
        <div className="notice-actions">
          {canRetry && onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Try again
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
