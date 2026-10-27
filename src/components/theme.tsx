"use client";
import { useSyncExternalStore } from "react";
const subscribe = (callback: () => void) => {
  window.addEventListener("campus-theme", callback);
  return () => window.removeEventListener("campus-theme", callback);
};
export function Theme() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  return (
    <button
      className="quiet"
      onClick={() => {
        document.documentElement.dataset.theme = dark ? "light" : "dark";
        window.dispatchEvent(new Event("campus-theme"));
      }}
      aria-pressed={dark}
    >
      ◐ <span>{dark ? "Light" : "Dark"} appearance</span>
    </button>
  );
}
