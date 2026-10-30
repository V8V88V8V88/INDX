import type { District } from "@/types";
import { colorIndexForRank, getMetricPaletteIndices } from "./map-view";

export type DistrictMetric = "population" | "area" | "density" | "literacyRate" | "sexRatio";

export const DISTRICT_METRICS: readonly DistrictMetric[] = ["population", "density", "literacyRate", "sexRatio", "area"];

export function isDistrictMetric(value: unknown): value is DistrictMetric {
  return DISTRICT_METRICS.includes(value as DistrictMetric);
}

export function normalizeDistrictName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’'".,()/]/g, "")
    .replace(/&/g, "and");
}

export function findDistrictByName(list: District[], name: string): District | null {
  const target = normalizeDistrictName(name);
  const exact = list.find((d) => normalizeDistrictName(d.name) === target);
  if (exact) return exact;

  const targetWords = target.split(/\s+/).filter((w) => w.length > 0);
  return list.find((d) => {
    const districtWords = normalizeDistrictName(d.name).split(/\s+/).filter((w) => w.length > 0);
    if (targetWords.length > 1 || districtWords.length > 1) {
      const shorter = targetWords.length <= districtWords.length ? targetWords : districtWords;
      const longer = targetWords.length > districtWords.length ? targetWords : districtWords;
      return shorter.every((word) => longer.includes(word));
    }
    return false;
  }) ?? null;
}

export function districtFillFor(districts: District[], metric: DistrictMetric) {
  const ranked = districts.filter((d) => d[metric] > 0).sort((a, b) => b[metric] - a[metric]);
  const palette = getMetricPaletteIndices(metric).map((i) => `var(--choro-${i})`);
  const colors = new Map(ranked.map((d, i) => [d.name, palette[colorIndexForRank(i, ranked.length, palette.length)]]));
  return (name: string) => {
    const district = findDistrictByName(districts, name);
    return district ? colors.get(district.name) : undefined;
  };
}
