import { states } from "@/data/india";

export type MapMetric = "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area";

export function isMapMetric(value: unknown): value is MapMetric {
  return value === "population" ||
    value === "gdp" ||
    value === "literacyRate" ||
    value === "hdi" ||
    value === "density" ||
    value === "sexRatio" ||
    value === "area";
}

/** Indices into the --choro-0..9 ramp used for each metric, lightest to darkest. */
export function getMetricPaletteIndices(metric: MapMetric): number[] {
  if (metric === "sexRatio") return [1, 2, 4, 5, 7, 8, 9];
  if (metric === "area") return [0, 1, 2, 4, 6, 7, 8, 9];
  if (metric === "hdi" || metric === "literacyRate") return [1, 2, 3, 5, 6, 8, 9];
  return [0, 1, 3, 5, 7, 8, 9];
}

/** State ids that have a value for `metric`, sorted highest first. */
export function rankStatesByMetric(metric: MapMetric): string[] {
  return states
    .filter((state) => state[metric] != null)
    .sort((a, b) => b[metric] - a[metric])
    .map((state) => state.id);
}

/** Palette index for a state's rank: rank 0 (highest) gets the darkest color. */
export function colorIndexForRank(rank: number, total: number, paletteSize: number): number {
  const ratio = rank / Math.max(total - 1, 1);
  const bucket = Math.min(Math.floor(ratio * paletteSize), paletteSize - 1);
  return paletteSize - 1 - bucket;
}

export function createStateMetricColorScale(metric: MapMetric) {
  const ranked = rankStatesByMetric(metric);

  if (ranked.length === 0) {
    return () => "var(--accent-primary)";
  }

  const colors = getMetricPaletteIndices(metric).map((i) => `var(--choro-${i})`);
  const rankMap = new Map(ranked.map((id, index) => [id, index]));

  return (value: number | undefined, stateId?: string) => {
    if (value == null || !stateId) return "var(--accent-primary)";

    const rank = rankMap.get(stateId);
    if (rank == null) return "var(--accent-primary)";

    return colors[colorIndexForRank(rank, ranked.length, colors.length)];
  };
}
