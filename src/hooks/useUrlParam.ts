"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getSearch = () => window.location.search;
const getServerSearch = () => "";

export function setUrlParams(updates: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(window.history.state, "", url);
  listeners.forEach((listener) => listener());
}

export function useUrlParam<T extends string>(key: string, fallback: T, isValid: (value: string) => boolean = () => true) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const raw = new URLSearchParams(search).get(key);
  const value = (raw !== null && isValid(raw) ? raw : fallback) as T;
  const setValue = useCallback((next: T) => setUrlParams({ [key]: next === fallback ? null : next }), [key, fallback]);
  return [value, setValue] as const;
}
