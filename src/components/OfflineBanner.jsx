import { useOnlineStatus } from "../hooks/useOnlineStatus";
import "./AppBanners.css";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="app-banner app-banner-offline" role="status">
      <span aria-hidden="true">📴</span> You're offline. Saved trips, campus info and ticket prices still work —
      live journeys and buses will return when you reconnect.
    </div>
  );
}
