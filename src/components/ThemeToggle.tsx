"use client";

import { useSyncExternalStore } from "react";
import { Icon, type IconName } from "./Icon";

type Theme = "system" | "light" | "dark";
const KEY = "eb-theme";
const EVENT = "eb-theme-change";
const ORDER: Theme[] = ["system", "light", "dark"];
const ICON: Record<Theme, IconName> = { system: "system", light: "sun", dark: "moon" };
const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (readTheme() === "system") applyTheme("system");
  };
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  mq.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
    mq.removeEventListener("change", onSystem);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* ignore: theme still applies for this session */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={cycle}
      aria-label={`Colour theme: ${LABEL[theme]}. Activate to switch.`}
      title={`Theme: ${LABEL[theme]}`}
    >
      <Icon name={ICON[theme]} size={16} />
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </button>
  );
}
