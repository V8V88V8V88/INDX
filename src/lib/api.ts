import type { District } from "@/types";

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

    // Keep the more "complete" / higher-population record, but merge missing bits.
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

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timeout));
  return controller.signal;
}

export async function fetchDistrictsFromAPI(stateCode: string): Promise<District[]> {
  try {
    const response = await fetch(`/data/districts/${stateCode.toLowerCase()}.json`, {
      signal: createTimeoutSignal(5000),
    });
    
    if (response.ok) {
      const districts = (await response.json()) as District[];
      return dedupeDistricts(districts);
    }
  } catch (error) {
    console.warn(`Failed to fetch districts for ${stateCode}:`, error);
  }

  return [];
}

// Data sources info
export const dataSources = {
  census: {
    name: "Census of India 2011",
    url: "https://censusindia.gov.in",
    description: "Official population census data",
  },
};
