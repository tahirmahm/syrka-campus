"use client";
import { useSyncExternalStore } from "react";
import { SunMoon } from "lucide-react";
const subscribe = (fn: () => void) => {
  window.addEventListener("campus-theme-change", fn);
  return () => window.removeEventListener("campus-theme-change", fn);
};
export function ThemeToggle({
  initialTheme = "dark",
}: {
  initialTheme?: "dark" | "light";
}) {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme || "dark",
    () => initialTheme,
  );
  return (
    <button
      type="button"
      className="quiet theme-toggle"
      aria-label={`Toggle colour theme: ${theme === "dark" ? "Light mode" : "Dark mode"}`}
      onClick={() => {
        const next =
          document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        document.documentElement.style.colorScheme = next;
        document.cookie = `campus-appearance=${next}; Path=/cam; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
        window.dispatchEvent(new Event("campus-theme-change"));
      }}
    >
      <SunMoon size={16} aria-hidden="true" />
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
