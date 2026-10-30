import type { MetricKey, State } from "@/types";

export const METRICS: readonly MetricKey[] = ["population", "gdp", "gdpPerCapita", "literacyRate", "hdi", "density", "sexRatio", "area"];

export const REGIONS: readonly State["region"][] = ["North", "South", "East", "West", "Central", "Northeast"];
