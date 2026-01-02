import type { District } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_DATA_GOV_API_KEY || "";
const API_BASE = "https://api.data.gov.in/resource";

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
          return data.records.map((r: Record<string, string>, idx: number) => ({
            id: `${stateCode}-${idx}`,
            name: r.district || r.state_district || r.name_of_the_district || "",
            stateId: stateCode,
            population: parseInt(r.total_population_in_nos_ || r.population || "0") || 0,
            area: parseFloat(r.area_sq_km_ || r.area || "0") || 0,
            density: Math.round(parseInt(r.total_population_in_nos_ || "0") / parseFloat(r.area_sq_km_ || "1")),
            literacyRate: parseFloat(r.total_literacy_rate || r.literacy_rate || "0") || 0,
            sexRatio: Math.round((parseInt(r.total_female_population_in_nos_ || "0") / parseInt(r.total_male_population_in_nos_ || "1")) * 1000) || 0,
          }));
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
      return response.json();
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
