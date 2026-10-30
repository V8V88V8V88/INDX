import * as d3 from "d3";

export const stateNameToCode: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OR",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TG",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  Delhi: "DL",
  "Jammu & Kashmir": "JK",
  Ladakh: "LA",
  Puducherry: "PY",
  Chandigarh: "CH",
  "Andaman & Nicobar": "AN",
  Lakshadweep: "LD",
  "Dadra and Nagar Haveli and Daman and Diu": "DD",
};

const EDGE_FADE =
  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)";

export const EDGE_FADE_STYLE = {
  maskImage: EDGE_FADE,
  WebkitMaskImage: EDGE_FADE,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as const;

export function rewindForD3<T extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>(feature: T): T {
  if (d3.geoArea(feature) <= 2 * Math.PI) return feature;
  const geometry = feature.geometry;
  const reverse = (rings: GeoJSON.Position[][]) => rings.map((ring) => [...ring].reverse());
  return {
    ...feature,
    geometry:
      geometry.type === "Polygon"
        ? { ...geometry, coordinates: reverse(geometry.coordinates) }
        : { ...geometry, coordinates: geometry.coordinates.map(reverse) },
  };
}
