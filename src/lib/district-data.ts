import { states } from "@/data/india";
import neighbours from "@/data/neighbours.json";
import odop from "@/data/odop.json";
import { districtFiles, placeNameFiles } from "@/data/server-data";
import { placeNameKey } from "./place-names";
import type { District } from "@/types";
import { districtFileName, prepareDistricts } from "./api";
import { districtSlug, findDistrictByName, type DistrictMetric } from "./districts";

export interface Rank {
  state: number;
  stateTotal: number;
  india: number;
  indiaTotal: number;
}

export interface Averages {
  literacyRate: number;
  sexRatio: number;
  density: number;
}

export interface OdopProduct {
  product: string;
  category: "Primary" | "Secondary" | "Tertiary" | "Others";
  sector: "Agriculture" | "Food Processing" | "Handicraft" | "Handloom" | "Textile" | "Manufacturing" | "Marine" | "Dairy" | "Others";
}

export interface DistrictProfile {
  district: District;
  ranks: Record<DistrictMetric, Rank>;
  stateAverages: Averages;
  indiaAverages: Averages;
  neighbours: string[];
  odop: OdopProduct[];
}

const RANKED: DistrictMetric[] = ["population", "area", "density", "literacyRate", "sexRatio"];

const byState = new Map(states.map((s) => [s.id, prepareDistricts(s.id, districtFiles[districtFileName(s.id)] ?? [])]));
const india = [...byState.values()].flat();

export function stateDistricts(stateId: string): District[] {
  return byState.get(stateId) ?? [];
}

export function allDistricts(): ReadonlyMap<string, District[]> {
  return byState;
}

export function findDistrict(stateId: string, slug: string) {
  const list = stateDistricts(stateId);
  return list.find((d) => districtSlug(d.name) === slug) ?? findDistrictByName(list, slug.replace(/-/g, " "));
}

function averages(list: District[]): Averages {
  const population = list.reduce((sum, d) => sum + d.population, 0);
  const area = list.reduce((sum, d) => sum + d.area, 0);
  const weighted = (key: "literacyRate" | "sexRatio") => {
    const known = list.filter((d) => d[key] > 0);
    const total = known.reduce((sum, d) => sum + d.population, 0);
    return known.reduce((sum, d) => sum + d[key] * d.population, 0) / (total || 1);
  };
  return { literacyRate: weighted("literacyRate"), sexRatio: weighted("sexRatio"), density: Math.round(population / (area || 1)) };
}

function rankOf(list: District[], target: District, metric: DistrictMetric) {
  const known = list.filter((d) => d[metric] > 0);
  return { rank: known.filter((d) => d[metric] > target[metric]).length + 1, total: known.length };
}

export function districtProfile(stateId: string, district: District): DistrictProfile {
  const stateList = stateDistricts(stateId);
  const ranks = Object.fromEntries(
    RANKED.map((metric) => {
      const inState = rankOf(stateList, district, metric);
      const inIndia = rankOf(india, district, metric);
      return [metric, { state: inState.rank, stateTotal: inState.total, india: inIndia.rank, indiaTotal: inIndia.total }];
    }),
  ) as Record<DistrictMetric, Rank>;

  return {
    district,
    ranks,
    stateAverages: averages(stateList),
    indiaAverages: averages(india),
    neighbours: (neighbours as Record<string, Record<string, string[]>>)[stateId]?.[district.name] ?? [],
    odop: (odop as Record<string, Record<string, OdopProduct[]>>)[stateId]?.[district.name] ?? [],
  };
}

export function localPlaceName(locale: string, stateId: string, name: string) {
  return placeNameFiles[locale]?.[stateId]?.[placeNameKey(name)] ?? name;
}
