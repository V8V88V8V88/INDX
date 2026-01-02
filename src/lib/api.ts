import type { District, State } from "@/types";

// data.gov.in API config
// Get your API key from: https://data.gov.in/user/register
const API_BASE = "https://api.data.gov.in/resource";
const API_KEY = process.env.NEXT_PUBLIC_DATA_GOV_API_KEY || "";

// Census 2011 District-wise data resource ID
const CENSUS_DISTRICT_RESOURCE = "f69a2ca8-4ddb-4c77-b353-7e4cd8a7e9a6";

export interface APIConfig {
  apiKey?: string;
  baseUrl?: string;
}

// fetch districts from data.gov.in
export async function fetchDistrictsFromAPI(stateCode: string): Promise<District[]> {
  if (!API_KEY) {
    console.warn("No data.gov.in API key configured. Using fallback data.");
    return fetchDistrictsFallback(stateCode);
  }

  try {
    const response = await fetch(
      `${API_BASE}/${CENSUS_DISTRICT_RESOURCE}?api-key=${API_KEY}&format=json&filters[state_code]=${stateCode}&limit=100`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.records.map((record: Record<string, string>, idx: number) => ({
      id: `${stateCode}-${idx}`,
      name: record.district_name || record.district,
      stateId: stateCode,
      population: parseInt(record.population) || 0,
      area: parseFloat(record.area_sq_km) || 0,
      density: parseInt(record.density) || 0,
      literacyRate: parseFloat(record.literacy_rate) || 0,
      sexRatio: parseInt(record.sex_ratio) || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch from API:", error);
    return fetchDistrictsFallback(stateCode);
  }
}

// fallback district data when API unavailable
async function fetchDistrictsFallback(stateCode: string): Promise<District[]> {
  try {
    const response = await fetch(`/data/districts/${stateCode.toLowerCase()}.json`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    // fallback not available
  }
  return [];
}

// fetch all states summary
export async function fetchStatesSummary(): Promise<Partial<State>[]> {
  if (!API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE}/state-wise-census-2011?api-key=${API_KEY}&format=json&limit=40`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch states:", error);
    return [];
  }
}

// check if API is configured
export function isAPIConfigured(): boolean {
  return Boolean(API_KEY);
}

// data sources info
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
  rbi: {
    name: "Reserve Bank of India",
    url: "https://rbi.org.in",
    description: "Economic and financial statistics",
  },
  niti: {
    name: "NITI Aayog",
    url: "https://niti.gov.in",
    description: "Development indices and HDI",
  },
};

