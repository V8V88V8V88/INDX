"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import { Button, Icon } from "./ui";

function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("theme");
  } catch {}
  if (stored === "dark" || stored === "light") return stored;
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
  return getTheme();
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export function ThemeToggle() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event("storage"));
  }, [theme]);

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <Button variant="ghost" size="sm" iconOnly onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
    </Button>
  );
}
