import type { MetricKey, State } from "@/types";

export const METRICS: readonly MetricKey[] = ["population", "gdp", "gdpPerCapita", "literacyRate", "hdi", "density", "sexRatio", "area"];

export const REGIONS: readonly State["region"][] = ["North", "South", "East", "West", "Central", "Northeast"];

export const METRIC_SOURCES: Record<MetricKey, string> = {
  population: "RGI 2026",
  gdp: "MoSPI",
  gdpPerCapita: "MoSPI",
  literacyRate: "PLFS 2023-24",
  hdi: "UNDP 2023",
  density: "RGI 2026",
  sexRatio: "RGI 2026",
  area: "Census 2011",
};

export const DISTRICT_SOURCES = {
  population: "IIPS 2026",
  literacyRate: "Census 2011",
  sexRatio: "IIPS 2026",
} as const;
