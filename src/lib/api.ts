import type { District } from "@/types";
import { getStateById } from "@/data/india";

function normalizeKey(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .replace(/[’'".,()/]/g, "");
}

function dedupeDistricts(input: District[]): District[] {
  const byName = new Map<string, District>();
  for (const d of input) {
    const name = (d.name || "").trim();
    if (!name) continue;
    const key = normalizeKey(name);
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, { ...d, name });
      continue;
    }

    // Merge duplicate districts, keep the one with higher population
    const keep = (d.population || 0) >= (prev.population || 0) ? d : prev;
    const drop = keep === d ? prev : d;

    const merged: District = {
      ...drop,
      ...keep,
      name: keep.name?.trim() || drop.name?.trim() || name,
      headquarters: keep.headquarters?.trim() || drop.headquarters?.trim(),
      population: Math.max(keep.population || 0, drop.population || 0),
      area: Math.max(keep.area || 0, drop.area || 0),
      literacyRate: Math.max(keep.literacyRate || 0, drop.literacyRate || 0),
      sexRatio: Math.max(keep.sexRatio || 0, drop.sexRatio || 0),
      density:
        (Math.max(keep.population || 0, drop.population || 0) > 0 &&
        Math.max(keep.area || 0, drop.area || 0) > 0)
          ? Math.round(
              Math.max(keep.population || 0, drop.population || 0) /
                Math.max(keep.area || 0, drop.area || 0),
            )
          : Math.max(keep.density || 0, drop.density || 0),
    };

    byName.set(key, merged);
  }

  return Array.from(byName.values());
}

function normalizeName(value: string | undefined | null): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function markCapitalAndMetro(stateCode: string, districts: District[]): District[] {
  const state = getStateById(stateCode);
  if (!state) return districts;

  const normalizedCapital = normalizeName(state.capital);
  const metroCityNames = new Set(
    state.cities
      .filter((c) => c.isMetro)
      .map((c) => normalizeName(c.name))
  );
  const capitalCityNames = new Set(
    state.cities
      .filter((c) => c.isCapital)
      .map((c) => normalizeName(c.name))
  );

  return districts.map((d) => {
    const name = normalizeName(d.name);
    const hq = normalizeName(d.headquarters);

    const isCapital =
      !!d.isCapital ||
      (!!normalizedCapital && (name === normalizedCapital || hq === normalizedCapital)) ||
      capitalCityNames.has(name) ||
      capitalCityNames.has(hq);

    const isMetro =
      !!d.isMetro ||
      metroCityNames.has(name) ||
      metroCityNames.has(hq) ||
      // Treat districts that are themselves the capital in key metros as metro areas
      // e.g. New Delhi district within the National Capital Region is a metro
      (state.code === "DL" && !!normalizedCapital && (name === normalizedCapital || hq === normalizedCapital)) ||
      // Districts marked as Tier 1 are effectively metro regions
      d.tier === 1;

    if (!isCapital && !isMetro) {
      return d;
    }

    return {
      ...d,
      ...(isCapital ? { isCapital: true } : {}),
      ...(isMetro ? { isMetro: true } : {}),
    };
  });
}

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timeout));
  return controller.signal;
}

const stateCodeToFileName: Record<string, string> = {
  "TG": "ts",
};

export async function fetchDistrictsFromAPI(stateCode: string): Promise<District[]> {
  try {
    const fileName = stateCodeToFileName[stateCode] || stateCode.toLowerCase();
    const response = await fetch(`/data/districts/${fileName}.json`, {
      signal: createTimeoutSignal(5000),
    });
    
    if (response.ok) {
      const districts = (await response.json()) as District[];
      const uniqueDistricts = dedupeDistricts(districts);
      return markCapitalAndMetro(stateCode, uniqueDistricts);
    }
  } catch (error) {
    console.warn(`Failed to fetch districts for ${stateCode}:`, error);
  }

  return [];
}

export const dataSources = {
  census: {
    name: "Census of India 2011",
    url: "https://censusindia.gov.in",
    description: "Official population census data",
  },
};
