const FX_KEY = "indx_fx_usd_inr";
const FX_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR";
const MAX_AGE = 24 * 60 * 60 * 1000;

export interface UsdRate {
  inrPerUsd: number;
  date: string | null;
}

export const FY_AVERAGE_INR_PER_USD: Record<string, number> = {
  "2023-24": 82.79,
  "2024-25": 84.54,
  "2025-26": 88.39,
};

const FALLBACK: UsdRate = { inrPerUsd: 95, date: null };

const listeners = new Set<() => void>();
let current: UsdRate | null = null;
let fetchedAt = 0;
let pending: Promise<void> | null = null;

function load(): UsdRate {
  if (current) return current;
  current = FALLBACK;
  try {
    const cached = JSON.parse(localStorage.getItem(FX_KEY) ?? "null");
    if (cached?.inrPerUsd > 0) {
      current = { inrPerUsd: cached.inrPerUsd, date: cached.date ?? null };
      fetchedAt = cached.fetchedAt ?? 0;
    }
  } catch {}
  return current;
}

function refresh() {
  if (pending || Date.now() - fetchedAt < MAX_AGE) return;
  pending = fetch(FX_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data: { date: string; rates: { INR: number } }) => {
      if (!(data.rates?.INR > 0)) return;
      current = { inrPerUsd: data.rates.INR, date: data.date };
      fetchedAt = Date.now();
      try {
        localStorage.setItem(FX_KEY, JSON.stringify({ ...current, fetchedAt }));
      } catch {}
      listeners.forEach((listener) => listener());
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
}

export function getUsdRate(): UsdRate {
  if (typeof window === "undefined") return FALLBACK;
  return load();
}

export function getServerUsdRate(): UsdRate {
  return FALLBACK;
}

export function subscribeUsdRate(listener: () => void): () => void {
  listeners.add(listener);
  load();
  refresh();
  return () => {
    listeners.delete(listener);
  };
}
