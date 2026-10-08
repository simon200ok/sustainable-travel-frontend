import { useTheme } from "../hooks/useTheme";

// Two states only: light or dark. The first visit follows the device's own setting.
export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      <span aria-hidden="true">{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}
