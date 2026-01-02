import type { District } from "@/types";

// fetch districts - uses local JSON files (Census 2011 data)
export async function fetchDistrictsFromAPI(stateCode: string): Promise<District[]> {
  try {
    const response = await fetch(`/data/districts/${stateCode.toLowerCase()}.json`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    // file not found
  }
  return [];
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
