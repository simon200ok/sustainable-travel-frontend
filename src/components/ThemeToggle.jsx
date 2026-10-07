import { useTheme } from "../hooks/useTheme";

const NEXT = { system: "light", light: "dark", dark: "system" };
const LABEL = { system: "Theme: automatic", light: "Theme: light", dark: "Theme: dark" };
const ICON = { system: "🌓", light: "☀️", dark: "🌙" };

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setPreference(NEXT[preference])}
      aria-label={`${LABEL[preference]}. Change theme`}
      title={LABEL[preference]}
    >
      <span aria-hidden="true">{ICON[preference]}</span>
    </button>
  );
}
