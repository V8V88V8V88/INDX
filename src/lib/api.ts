import type { District } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_DATA_GOV_API_KEY || "";
const API_BASE = "https://api.data.gov.in/resource";

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

// Known resource IDs for district data (state-specific on data.gov.in)
const RESOURCE_IDS: Record<string, string> = {
  // Tamil Nadu district census data
  TN: "8zua1bmcu63ffnow66uulnpma2me0ocy",
};

// State name mapping for API filters
const STATE_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh",
  AS: "Assam", 
  BR: "Bihar",
  CG: "Chhattisgarh",
  DL: "Delhi",
  GJ: "Gujarat",
  HR: "Haryana",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MH: "Maharashtra",
  MP: "Madhya Pradesh",
  OR: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  TN: "Tamil Nadu",
  TS: "Telangana",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
};

export async function fetchDistrictsFromAPI(stateCode: string): Promise<District[]> {
  // Try API first if we have a resource ID for this state
  if (API_KEY && RESOURCE_IDS[stateCode]) {
    try {
      const resourceId = RESOURCE_IDS[stateCode];
      const url = `${API_BASE}/${resourceId}?format=json&api-key=${API_KEY}&limit=100`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.records && data.records.length > 0) {
          const parsed = data.records.map((r: Record<string, string>, idx: number) => {
            const pop = parseInt(r.total_population_in_nos_ || r.population || "0") || 0;
            const area = parseFloat(r.area_sq_km_ || r.area || "0") || 0;
            const male = parseInt(r.total_male_population_in_nos_ || "0") || 0;
            const female = parseInt(r.total_female_population_in_nos_ || "0") || 0;

            return {
              id: `${stateCode}-${idx}`,
              name: r.district || r.state_district || r.name_of_the_district || "",
              stateId: stateCode,
              population: pop,
              area,
              density: pop > 0 && area > 0 ? Math.round(pop / area) : 0,
              literacyRate: parseFloat(r.total_literacy_rate || r.literacy_rate || "0") || 0,
              sexRatio: male > 0 && female > 0 ? Math.round((female / male) * 1000) : 0,
            } satisfies District;
          });

          return dedupeDistricts(parsed);
        }
      }
    } catch (error) {
      console.warn(`API fetch failed for ${stateCode}:`, error);
    }
  }

  // Fallback to local JSON files (comprehensive Census 2011 data)
  try {
    const response = await fetch(`/data/districts/${stateCode.toLowerCase()}.json`);
    if (response.ok) {
      const districts = (await response.json()) as District[];
      return dedupeDistricts(districts);
    }
  } catch {
    // File not available
  }
  
  return [];
}

// Check API connectivity
export async function checkAPIStatus(): Promise<{ connected: boolean; message: string }> {
  if (!API_KEY) {
    return { connected: false, message: "API key not configured" };
  }

  try {
    const response = await fetch(
      `${API_BASE}/6176ee09-3d56-4a3b-8115-21841576b2f6?format=json&api-key=${API_KEY}&limit=1`
    );
    if (response.ok) {
      return { connected: true, message: "Connected to data.gov.in" };
    }
    return { connected: false, message: `API error: ${response.status}` };
  } catch (error) {
    return { connected: false, message: `Connection failed: ${error}` };
  }
}

// Data sources info
export const dataSources = {
  census: {
    name: "Census of India 2011",
    url: "https://censusindia.gov.in",
    description: "Official population census data",
  },
  dataGov: {
    name: "data.gov.in",
    url: "https://data.gov.in",
    description: "Open Government Data Platform",
  },
};

export function getStateName(code: string): string {
  return STATE_NAMES[code] || code;
}
