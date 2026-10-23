"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CityCard,
  ComparisonTable,
  Footer,
  Header,
  InlineSearch,
  StateMap,
  type ComparisonRow,
} from "@/components";
import { Badge, Card, CardTitle } from "@/components/ui";
import { useDistricts } from "@/hooks/useDistricts";
import { useFormat } from "@/hooks/useFormat";
import type { PlaceResult } from "@/hooks/useSearch";
import type { City, District, State } from "@/types";

type CompareItem =
  | { type: "state"; state: State }
  | { type: "city"; state: State; city: City }
  | { type: "district"; state: State; district: District };

type PlaceItem = Exclude<CompareItem, { type: "state" }>;

function toCompareItem(result: PlaceResult): CompareItem {
  if (result.type === "city" && result.city) return { type: "city", state: result.state, city: result.city };
  if (result.type === "district" && result.district) return { type: "district", state: result.state, district: result.district };
  return { type: "state", state: result.state };
}

function itemName(item: CompareItem) {
  if (item.type === "city") return item.city.name;
  if (item.type === "district") return item.district.name;
  return item.state.name;
}

function itemFigures(item: CompareItem) {
  if (item.type === "city") {
    const { population, area } = item.city;
    return { population, area, density: Math.round(population / area) };
  }
  const { population, area, density } = item.type === "district" ? item.district : item.state;
  return { population, area, density };
}

function placeAsCity(item: PlaceItem): City {
  if (item.type === "city") return item.city;
  const d = item.district;
  return {
    id: d.id || d.name,
    name: d.name,
    stateId: d.stateId,
    districtId: d.id,
    population: d.population,
    area: d.area,
    isCapital: !!d.isCapital,
    isMetro: !!d.isMetro || d.tier === 1,
    tier: (d.tier || 3) as City["tier"],
  };
}

function rankDistricts(districts: District[]) {
  return [...districts].sort((a, b) => {
    const tierDiff = (a.tier || 999) - (b.tier || 999);
    if (tierDiff) return tierDiff;
    if (!!a.isMetro !== !!b.isMetro) return a.isMetro ? -1 : 1;
    if (!!a.isCapital !== !!b.isCapital) return a.isCapital ? -1 : 1;
    if (a.literacyRate !== b.literacyRate) return b.literacyRate - a.literacyRate;
    return b.population - a.population;
  });
}

function CompareColumn({ item, side }: { item: CompareItem | null; side: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      {item ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary">{itemName(item)}</h2>
            <Badge variant={item.type === "state" ? "accent" : "outline"}>{item.state.code}</Badge>
          </div>
          <div className="card min-h-[500px] p-4">
            <StateMap
              stateCode={item.state.id}
              selectedDistrict={item.type === "state" ? null : itemName(item)}
              onDistrictSelect={() => {}}
              onDistrictClick={() => {}}
            />
          </div>
          {item.type !== "state" && <CityCard city={placeAsCity(item)} stateName={item.state.name} />}
        </>
      ) : (
        <div className="card flex min-h-[500px] items-center justify-center p-4">
          <p className="text-text-muted">Select a state, city, or district</p>
        </div>
      )}
    </motion.div>
  );
}

function TopDistricts({ state }: { state: State }) {
  const { data: districts } = useDistricts(state.id);
  const { formatPopulation } = useFormat();
  const top = districts ? rankDistricts(districts).slice(0, 5) : [];

  return (
    <Card>
      <CardTitle className="mb-4">Top Districts · {state.name}</CardTitle>
      {top.length > 0 ? (
        <ul>
          {top.map((district) => (
            <li
              key={district.id || district.name}
              className="flex items-center justify-between border-b border-border-light/50 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{district.name}</p>
                {district.tier && <p className="text-xs text-text-muted">Tier {district.tier}</p>}
              </div>
              <p className="font-mono text-sm text-text-secondary">{formatPopulation(district.population)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">No district data available</p>
      )}
    </Card>
  );
}

function useComparisonRows(left: CompareItem, right: CompareItem): ComparisonRow[] {
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  const pair = <T,>(fn: (item: CompareItem) => T): [T, T] => [fn(left), fn(right)];

  const rows: ComparisonRow[] = [
    { label: "Population", values: pair((i) => formatPopulation(itemFigures(i).population)) },
    { label: "Area", values: pair((i) => formatArea(itemFigures(i).area)) },
    { label: "Density", values: pair((i) => formatDensity(itemFigures(i).density)) },
  ];

  if (left.type === "state" && right.type === "state") {
    const s = (fn: (state: State) => string): [string, string] => [fn(left.state), fn(right.state)];
    rows.push(
      { label: "Literacy Rate", values: s((x) => `${x.literacyRate.toFixed(1)}%`) },
      { label: "HDI", values: s((x) => x.hdi.toFixed(3)) },
      { label: "Sex Ratio", values: s((x) => x.sexRatio.toString()) },
      { label: "GDP", values: s((x) => formatCurrency(x.gdp * 10000000)) },
      { label: "Capital", values: s((x) => x.capital) },
      { label: "Region", values: s((x) => x.region) },
      { label: "Major Cities", values: s((x) => x.cities.length.toString()) },
    );
  } else if (left.type !== "state" && right.type !== "state") {
    const p = (fn: (place: City, item: PlaceItem) => string): [string, string] => [
      fn(placeAsCity(left), left),
      fn(placeAsCity(right), right),
    ];
    rows.push(
      { label: "Tier", values: p((c) => `Tier ${c.tier}`) },
      { label: "Metro", values: p((c) => (c.isMetro || c.tier === 1 ? "Yes" : "No")) },
      { label: "Capital", values: p((c) => (c.isCapital ? "Yes" : "No")) },
      { label: "State", values: p((_, i) => i.state.name) },
      { label: "Sex Ratio", values: p((_, i) => (i.type === "district" && i.district.sexRatio ? i.district.sexRatio.toString() : "N/A")) },
      { label: "Literacy", values: p((_, i) => (i.type === "district" ? `${i.district.literacyRate}%` : "N/A")) },
    );
  }

  return rows;
}

function Comparison({ left, right }: { left: CompareItem; right: CompareItem }) {
  const rows = useComparisonRows(left, right);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-headline text-text-primary">Comparison</h2>
      <ComparisonTable title="Basic Statistics" columns={[itemName(left), itemName(right)]} rows={rows} />
      {left.type === "state" && right.type === "state" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopDistricts state={left.state} />
          <TopDistricts state={right.state} />
        </div>
      )}
    </motion.section>
  );
}

export default function ComparePage() {
  const [left, setLeft] = useState<CompareItem | null>(null);
  const [right, setRight] = useState<CompareItem | null>(null);

  const slots = [
    { label: "Item 1", placeholder: "Search for first state, city, or district...", set: setLeft },
    { label: "Item 2", placeholder: "Search for second state, city, or district...", set: setRight },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "Compare", href: "/compare" }]} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-display mb-3 text-text-primary">Compare</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Select two states, cities, or districts to compare their geographic, demographic, and economic data side by side.
          </p>
        </motion.section>

        <section className="mb-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {slots.map((slot) => (
            <div key={slot.label} className="space-y-3">
              <p className="text-sm font-semibold text-text-secondary">{slot.label}</p>
              <InlineSearch
                placeholder={slot.placeholder}
                onSelect={(result) => result.type !== "page" && slot.set(toCompareItem(result))}
                onClear={() => slot.set(null)}
              />
            </div>
          ))}
        </section>

        {(left || right) && (
          <section className="relative mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CompareColumn item={left} side="left" />
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-border-light lg:block" />
            <CompareColumn item={right} side="right" />
          </section>
        )}

        {left && right && <Comparison left={left} right={right} />}
      </main>
      <Footer />
    </div>
  );
}
