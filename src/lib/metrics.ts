import type { MetricKey } from "@/types";

export const METRICS: readonly { key: MetricKey; label: string; longLabel: string }[] = [
  { key: "population", label: "Population", longLabel: "Population" },
  { key: "gdp", label: "GDP", longLabel: "GDP" },
  { key: "gdpPerCapita", label: "GDP / Person", longLabel: "GDP per Person" },
  { key: "literacyRate", label: "Literacy", longLabel: "Literacy Rate" },
  { key: "hdi", label: "HDI", longLabel: "Human Development Index" },
  { key: "density", label: "Density", longLabel: "Population Density" },
  { key: "sexRatio", label: "Sex Ratio", longLabel: "Sex Ratio" },
  { key: "area", label: "Area", longLabel: "Area" },
];

export function getMetric(key: MetricKey) {
  return METRICS.find((m) => m.key === key)!;
}
