import { states } from "@/data/india";

export type MapMetric = "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area";

export interface MapTransformSnapshot {
  k: number;
  x: number;
  y: number;
}

export interface MapViewSnapshot {
  transform: MapTransformSnapshot;
  showLabels: boolean;
  colorByMetric: MapMetric;
}

const MAP_VIEW_HANDOFF_KEY = "indx.map.view.handoff";

function sanitizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isMapMetric(value: unknown): value is MapMetric {
  return value === "population" ||
    value === "gdp" ||
    value === "literacyRate" ||
    value === "hdi" ||
    value === "density" ||
    value === "sexRatio" ||
    value === "area";
}

function sanitizeSnapshot(value: unknown): MapViewSnapshot | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<MapViewSnapshot>;
  const transform = candidate.transform;

  if (!transform || typeof transform !== "object") return null;

  return {
    transform: {
      k: sanitizeNumber((transform as Partial<MapTransformSnapshot>).k, 1),
      x: sanitizeNumber((transform as Partial<MapTransformSnapshot>).x, 0),
      y: sanitizeNumber((transform as Partial<MapTransformSnapshot>).y, 0),
    },
    showLabels: typeof candidate.showLabels === "boolean" ? candidate.showLabels : true,
    colorByMetric: isMapMetric(candidate.colorByMetric) ? candidate.colorByMetric : "population",
  };
}

export function writeMapViewHandoff(snapshot: MapViewSnapshot) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(MAP_VIEW_HANDOFF_KEY, JSON.stringify(snapshot));
  } catch {}
}

export function consumeMapViewHandoff() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(MAP_VIEW_HANDOFF_KEY);
    window.sessionStorage.removeItem(MAP_VIEW_HANDOFF_KEY);

    if (!raw) return null;

    return sanitizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function createMapViewQueryString(snapshot: MapViewSnapshot) {
  const params = new URLSearchParams();

  params.set("k", snapshot.transform.k.toFixed(4));
  params.set("x", snapshot.transform.x.toFixed(2));
  params.set("y", snapshot.transform.y.toFixed(2));
  params.set("m", snapshot.colorByMetric);
  params.set("labels", snapshot.showLabels ? "1" : "0");

  return params.toString();
}

export function parseMapViewSearchParams(params?: Pick<URLSearchParams, "get"> | null) {
  if (!params) return null;

  const metric = params.get("m");
  const k = Number(params.get("k"));
  const x = Number(params.get("x"));
  const y = Number(params.get("y"));
  const labels = params.get("labels");

  if (!isMapMetric(metric)) return null;

  return sanitizeSnapshot({
    transform: {
      k,
      x,
      y,
    },
    showLabels: labels === null ? true : labels === "1",
    colorByMetric: metric,
  });
}

export function getMetricLegendColors(metric: MapMetric) {
  if (metric === "sexRatio") {
    return ["var(--choro-1)", "var(--choro-2)", "var(--choro-4)", "var(--choro-5)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];
  }

  if (metric === "area") {
    return ["var(--choro-0)", "var(--choro-1)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];
  }

  if (metric === "hdi" || metric === "literacyRate") {
    return ["var(--choro-1)", "var(--choro-2)", "var(--choro-3)", "var(--choro-5)", "var(--choro-6)", "var(--choro-8)", "var(--choro-9)"];
  }

  return ["var(--choro-0)", "var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];
}

export function createStateMetricColorScale(metric: MapMetric) {
  const stateValues = states
    .map((state) => ({
      id: state.id,
      value: state[metric],
    }))
    .filter((item) => item.value != null) as { id: string; value: number }[];

  if (stateValues.length === 0) {
    return () => "var(--accent-primary)";
  }

  stateValues.sort((a, b) => b.value - a.value);

  const colors = getMetricLegendColors(metric);
  const rankMap = new Map<string, number>();

  stateValues.forEach((item, index) => {
    rankMap.set(item.id, index);
  });

  return (value: number | undefined, stateId?: string) => {
    if (value == null || !stateId) return "var(--accent-primary)";

    const rank = rankMap.get(stateId);
    if (rank == null) return "var(--accent-primary)";

    const ratio = rank / Math.max(stateValues.length - 1, 1);
    const colorIndex = Math.min(Math.floor(ratio * colors.length), colors.length - 1);

    return colors[colors.length - 1 - colorIndex];
  };
}
