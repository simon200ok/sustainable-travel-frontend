import { useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { readJSON, writeJSON } from "../lib/storage";
import "./AppBanners.css";

const DISMISS_KEY = "uos-install-dismissed";

export default function InstallBanner() {
  const { canInstall, install, installed, isIos } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => readJSON(DISMISS_KEY, false));

  if (installed || dismissed || (!canInstall && !isIos)) return null;

  const dismiss = () => {
    writeJSON(DISMISS_KEY, true);
    setDismissed(true);
  };

  return (
    <div className="app-banner app-banner-install" role="region" aria-label="Install the app">
      <span aria-hidden="true">📲</span>
      <span className="app-banner-text">
        {canInstall
          ? "Add Sustainable Travel Hub to your home screen for one-tap journeys, even offline."
          : "Install this app: tap Share, then “Add to Home Screen”."}
      </span>
      {canInstall && (
        <button type="button" className="app-banner-btn" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="app-banner-close" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
