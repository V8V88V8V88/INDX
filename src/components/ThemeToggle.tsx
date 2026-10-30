"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon } from "./ui";

export type ThemePreference = "system" | "light" | "dark";

function getPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("theme");
  } catch {}
  return stored === "dark" || stored === "light" ? stored : "system";
}

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

const noopSubscribe = () => () => {};

function getSnapshot() {
  return resolve(getPreference());
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", preference);
  } catch {}
  document.documentElement.classList.toggle("dark", resolve(preference) === "dark");
  window.dispatchEvent(new Event("storage"));
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getPreference, () => "system");
}

export function ThemeToggle() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useTranslations("Nav");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = useCallback(() => {
    setThemePreference(theme === "light" ? "dark" : "light");
  }, [theme]);

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <Button variant="ghost" size="sm" iconOnly onClick={toggle} aria-label={t("toggleTheme")} title={t("toggleTheme")}>
      <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
    </Button>
  );
}
