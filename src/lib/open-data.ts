import type { District, State } from "@/types";
import type { CsvColumn } from "./csv";

export const STATE_COLUMNS: CsvColumn<State>[] = [
  ["id", (s) => s.id],
  ["name", (s) => s.name],
  ["capital", (s) => s.capital],
  ["region", (s) => s.region],
  ["population", (s) => s.population],
  ["area_km2", (s) => s.area],
  ["density_per_km2", (s) => s.density],
  ["literacy_rate", (s) => s.literacyRate],
  ["sex_ratio", (s) => s.sexRatio],
  ["gsdp_crore_inr", (s) => s.gdp],
  ["gsdp_year", (s) => s.gdpYear],
  ["gsdp_per_capita_inr", (s) => s.gdpPerCapita],
  ["hdi", (s) => s.hdi],
];

export const DISTRICT_COLUMNS: CsvColumn<District>[] = [
  ["id", (d) => d.id],
  ["name", (d) => d.name],
  ["state_id", (d) => d.stateId],
  ["headquarters", (d) => d.headquarters],
  ["population", (d) => d.population],
  ["area_km2", (d) => d.area],
  ["density_per_km2", (d) => d.density],
  ["literacy_rate", (d) => d.literacyRate],
  ["sex_ratio", (d) => d.sexRatio],
  ["tier", (d) => d.tier],
  ["is_capital", (d) => !!d.isCapital],
];

export function stateSummary(s: State) {
  return {
    id: s.id,
    name: s.name,
    capital: s.capital,
    region: s.region,
    population: s.population,
    area: s.area,
    density: s.density,
    literacyRate: s.literacyRate,
    sexRatio: s.sexRatio,
    gsdpCroreInr: s.gdp,
    gsdpYear: s.gdpYear,
    gsdpPerCapitaInr: s.gdpPerCapita,
    hdi: s.hdi,
    cities: s.cities.map((c) => ({
      id: c.id,
      name: c.name,
      population: c.population,
      area: c.area,
      isCapital: c.isCapital,
      isMetro: c.isMetro,
      tier: c.tier,
    })),
  };
}
