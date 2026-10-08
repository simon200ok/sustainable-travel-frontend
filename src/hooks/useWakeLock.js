import { useEffect, useRef } from "react";

// Keeps the screen on while navigating (where the browser allows it)
export function useWakeLock(active) {
  const lock = useRef(null);
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return undefined;
    const request = async () => {
      try {
        lock.current = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed (e.g. battery saver); navigation still works
      }
    };
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock.current?.release().catch(() => {});
    };
  }, [active]);
}
