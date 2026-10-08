// Colour helpers for readable badges (WCAG contrast). Needed because zone and operator
// colours can be changed by admins.
const DARK_TEXT = '#1a1a1a';

function luminance(hex) {
  const value = /^#?([0-9a-f]{6})$/i.exec(hex || '')?.[1];
  if (!value) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  if (x == null || y == null) return 0;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Black-ish or white text, whichever is easier to read on the background
export function readableTextOn(background) {
  return contrastRatio(DARK_TEXT, background) > contrastRatio('#ffffff', background) ? DARK_TEXT : '#ffffff';
}

// True if neither text colour reaches the 4.5:1 minimum on this background
export function isHardToRead(background) {
  return contrastRatio(readableTextOn(background), background) < 4.5;
}
