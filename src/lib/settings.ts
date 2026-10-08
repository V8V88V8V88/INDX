export const SETTINGS_KEY = "indx_settings";

export type DistanceUnit = "km" | "miles";
export type NumberFormat = "indian" | "international";
export type Currency = "INR" | "USD";

export interface Settings {
  accentColor: string;
  distanceUnit: DistanceUnit;
  numberFormat: NumberFormat;
  currency: Currency;
}

export const defaultSettings: Settings = {
  accentColor: "teal",
  distanceUnit: "km",
  numberFormat: "indian",
  currency: "INR",
};

const listeners = new Set<() => void>();

// Snapshot is cached by the raw stored string so useSyncExternalStore
// gets a stable object between reads.
let cachedRaw: string | null = null;
let cachedSettings: Settings = defaultSettings;

function readRaw(): string | null {
  try {
    return localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;

  const raw = readRaw();
  if (raw === cachedRaw) return cachedSettings;

  cachedRaw = raw;
  try {
    cachedSettings = raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) } : defaultSettings;
  } catch {
    cachedSettings = defaultSettings;
  }
  return cachedSettings;
}

export function getServerSettings(): Settings {
  return defaultSettings;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  const updated = { ...getSettings(), [key]: value };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // Storage failed, ignore
  }
  listeners.forEach((listener) => listener());
}
