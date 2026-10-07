import { useState } from "react";

/**
 * "You are here" marker: a navigation arrow with a torch-like beam pointing the way
 * the person is facing. Without a known direction it falls back to a pulsing dot,
 * so the map never points someone the wrong way.
 */
export default function UserLocationMarker({ heading }) {
  // Unwrapped angle, so 359° → 2° turns 3° clockwise instead of spinning back round
  const [prevHeading, setPrevHeading] = useState(heading);
  const [rotation, setRotation] = useState(heading ?? 0);
  if (heading !== prevHeading) {
    setPrevHeading(heading);
    if (heading != null) {
      setRotation((r) => r + ((((heading - (r % 360)) % 360) + 540) % 360) - 180);
    }
  }

  if (heading == null) {
    return <span className="map-user-dot" aria-hidden="true" />;
  }

  return (
    <div className="user-heading" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <radialGradient id="uos-beam" cx="60" cy="60" r="58" gradientUnits="userSpaceOnUse">
            <stop offset="0.15" stopColor="#1A73E8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1A73E8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Beam: a 60° cone fanning out ahead of the arrow */}
        <path d="M60 60 L31 9.8 A58 58 0 0 1 89 9.8 Z" fill="url(#uos-beam)" />
        {/* Arrow head */}
        <path d="M60 42 L72 72 L60 65 L48 72 Z" fill="#1A73E8" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
