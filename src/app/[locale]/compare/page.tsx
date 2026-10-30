"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Footer, Header, InlineSearch, StateMap } from "@/components";
import { cn } from "@/lib/cn";
import { EASE_OUT, reveal } from "@/lib/motion";
import { useDistricts } from "@/hooks/useDistricts";
import { useFormat } from "@/hooks/useFormat";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { getStateById } from "@/data/india";
import type { PlaceResult } from "@/hooks/useSearch";
import type { City, District, State } from "@/types";

type CompareItem =
  | { type: "state"; state: State }
  | { type: "city"; state: State; city: City }
  | { type: "district"; state: State; district: District };

type PlaceItem = Exclude<CompareItem, { type: "state" }>;

interface CompareRow {
  label: string;
  values: [ReactNode, ReactNode];
  raw?: [number, number];
  block?: boolean;
  higherIsBetter?: boolean;
}

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

function useItemLabel() {
  const { stateName, placeName } = usePlaceNames();
  return (item: CompareItem) =>
    item.type === "state" ? stateName(item.state.id, item.state.name) : placeName(item.state.id, itemName(item));
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
  const reduceMotion = useReducedMotion();
  const t = useTranslations("Compare");
  const { placeName } = usePlaceNames();
  return (
    <motion.div {...reveal(reduceMotion, side === "left" ? 0.04 : 0.08)} className="space-y-4">
      {item ? (
        <>
          <div>
            <StateMap
              stateCode={item.state.id}
              selectedDistrict={item.type === "state" ? null : itemName(item)}
              onDistrictSelect={() => {}}
              onDistrictClick={() => {}}
              labelFor={(name) => placeName(item.state.id, name)}
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border-light">
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      )}
    </motion.div>
  );
}

function TopDistricts({ state, align }: { state: State; align: "left" | "right" }) {
  const { data: districts } = useDistricts(state.id);
  const { formatPopulation } = useFormat();
  const t = useTranslations("Compare");
  const { placeName } = usePlaceNames();
  const top = districts ? rankDistricts(districts).slice(0, 5) : [];

  if (top.length === 0) return <p className="text-sm text-text-muted">{t("noDistrictData")}</p>;

  return (
    <ul className="space-y-1.5">
      {top.map((district) => (
        <li
          key={district.id || district.name}
          className={cn("flex items-baseline gap-2", align === "left" && "flex-row-reverse")}
        >
          <span className="truncate text-sm font-medium text-text-primary">{placeName(state.id, district.name)}</span>
          <span className="shrink-0 text-xs tabular-nums text-text-muted">{formatPopulation(district.population)}</span>
        </li>
      ))}
    </ul>
  );
}

function useComparisonRows(left: CompareItem, right: CompareItem): CompareRow[] {
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  const t = useTranslations("Compare");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");
  const tRegions = useTranslations("Regions");
  const { stateName, capitalName } = usePlaceNames();
  const pair = <T,>(fn: (item: CompareItem) => T): [T, T] => [fn(left), fn(right)];
  const figures = pair(itemFigures);
  const numeric = (
    label: string,
    raw: [number, number],
    format: (value: number) => string,
    higherIsBetter?: boolean,
  ): CompareRow => ({ label, raw, values: [format(raw[0]), format(raw[1])], higherIsBetter });

  const rows: CompareRow[] = [
    numeric(tMetrics("population.short"), [figures[0].population, figures[1].population], formatPopulation),
    numeric(tMetrics("area.short"), [figures[0].area, figures[1].area], formatArea),
    numeric(tMetrics("density.short"), [figures[0].density, figures[1].density], formatDensity),
  ];

  if (left.type === "state" && right.type === "state") {
    const s = (fn: (state: State) => number): [number, number] => [fn(left.state), fn(right.state)];
    const money = (label: string, fn: (state: State) => number): CompareRow => ({
      label,
      raw: s(fn),
      values: [formatCurrency(fn(left.state), left.state.gdpYear), formatCurrency(fn(right.state), right.state.gdpYear)],
      higherIsBetter: true,
    });
    rows.push(
      numeric(tMetrics("literacyRate.short"), s((x) => x.literacyRate), (v) => `${v.toFixed(1)}%`, true),
      numeric(tMetrics("hdi.short"), s((x) => x.hdi), (v) => v.toFixed(3), true),
      numeric(tMetrics("sexRatio.short"), s((x) => x.sexRatio), (v) => v.toString(), true),
      money(tMetrics("gsdp"), (x) => x.gdp * 10000000),
      money(tMetrics("gsdpPerPerson"), (x) => Math.round((x.gdp * 10000000) / x.population)),
      { label: t("capital"), values: [capitalName(left.state.id, left.state.capital), capitalName(right.state.id, right.state.capital)] },
      { label: t("region"), values: [tRegions(left.state.region), tRegions(right.state.region)] },
      {
        label: t("topDistricts"),
        block: true,
        values: [<TopDistricts key="l" state={left.state} align="left" />, <TopDistricts key="r" state={right.state} align="right" />],
      },
    );
  } else if (left.type !== "state" && right.type !== "state") {
    const p = (fn: (place: City, item: PlaceItem) => ReactNode): [ReactNode, ReactNode] => [
      fn(placeAsCity(left), left),
      fn(placeAsCity(right), right),
    ];
    const districtValue = (item: PlaceItem, fn: (d: District) => number) =>
      item.type === "district" ? fn(item.district) : null;
    const literacy: [number | null, number | null] = [
      districtValue(left, (d) => d.literacyRate),
      districtValue(right, (d) => d.literacyRate),
    ];
    const sexRatio: [number | null, number | null] = [
      districtValue(left, (d) => d.sexRatio),
      districtValue(right, (d) => d.sexRatio),
    ];

    if (literacy[0] && literacy[1]) rows.push(numeric(tMetrics("literacyRate.short"), [literacy[0], literacy[1]], (v) => `${v}%`, true));
    if (sexRatio[0] && sexRatio[1]) rows.push(numeric(tMetrics("sexRatio.short"), [sexRatio[0], sexRatio[1]], (v) => v.toString(), true));
    const yesNo = (value: boolean) => (value ? tCommon("yes") : tCommon("no"));
    rows.push(
      { label: t("tier"), values: p((c) => tCommon("tier", { tier: c.tier })) },
      { label: t("metro"), values: p((c) => yesNo(c.isMetro || c.tier === 1)) },
      { label: t("capital"), values: p((c) => yesNo(c.isCapital)) },
      { label: t("state"), values: p((_, i) => stateName(i.state.id, i.state.name)) },
    );
  }

  return rows;
}

function CompareBar({ share, align, strong }: { share: number; align: "left" | "right"; strong: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn("flex h-1.5 overflow-hidden rounded-full bg-bg-tertiary", align === "left" && "justify-end")}>
      <motion.div
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${share * 100}%` }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
        className={cn("h-full rounded-full", strong ? "bg-accent-primary" : "bg-text-muted/50")}
      />
    </div>
  );
}

function HeadToHead({ left, right, rows }: { left: string; right: string; rows: CompareRow[] }) {
  const t = useTranslations("Compare");

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border-light px-1 pb-4">
        <p className="truncate text-right font-semibold text-text-primary">{left}</p>
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">{t("versus")}</span>
        <p className="truncate font-semibold text-text-primary">{right}</p>
      </div>

      <div className="divide-y divide-border-light/60">
        {rows.map((row) => {
          const max = row.raw ? Math.max(row.raw[0], row.raw[1]) : 0;
          const winner =
            row.raw && row.higherIsBetter !== undefined && row.raw[0] !== row.raw[1]
              ? (row.raw[0] > row.raw[1]) === row.higherIsBetter
                ? 0
                : 1
              : null;

          return (
            <div key={row.label} className="px-1 py-3.5">
              <div className="grid grid-cols-[1fr_7rem_1fr] items-baseline gap-3 sm:grid-cols-[1fr_9rem_1fr]">
                {row.values.map((value, i) =>
                  row.block ? (
                    <div key={i} className={cn("min-w-0 self-start", i === 0 ? "order-1" : "order-3")}>
                      {value}
                    </div>
                  ) : (
                    <p
                      key={i}
                      className={cn(
                        "truncate text-base font-semibold tabular-nums sm:text-lg",
                        i === 0 ? "order-1 text-right" : "order-3",
                        winner === i ? "text-accent-primary" : "text-text-primary",
                      )}
                    >
                      {value}
                    </p>
                  ),
                )}
                <p className={cn("order-2 text-center text-xs font-medium uppercase tracking-wide text-text-muted", row.block && "self-start pt-0.5")}>
                  {row.label}
                </p>
              </div>
              {row.raw && max > 0 && (
                <div className="mt-2 grid grid-cols-[1fr_7rem_1fr] gap-3 sm:grid-cols-[1fr_9rem_1fr]">
                  <CompareBar share={row.raw[0] / max} align="left" strong={winner === null ? row.raw[0] >= row.raw[1] : winner === 0} />
                  <span />
                  <CompareBar share={row.raw[1] / max} align="right" strong={winner === null ? row.raw[1] >= row.raw[0] : winner === 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Comparison({ left, right }: { left: CompareItem; right: CompareItem }) {
  const rows = useComparisonRows(left, right);
  const reduceMotion = useReducedMotion();
  const itemLabel = useItemLabel();

  return (
    <motion.section {...reveal(reduceMotion, 0.16)}>
      <HeadToHead left={itemLabel(left)} right={itemLabel(right)} rows={rows} />
    </motion.section>
  );
}

const subscribeNothing = () => () => {};
const getInitialStateId = () => new URLSearchParams(window.location.search).get("a") ?? "";
const getServerInitialStateId = () => "";

export default function ComparePage() {
  const reduceMotion = useReducedMotion();
  const initialStateId = useSyncExternalStore(subscribeNothing, getInitialStateId, getServerInitialStateId);
  const [pickedLeft, setLeft] = useState<CompareItem | null | undefined>(undefined);
  const [right, setRight] = useState<CompareItem | null>(null);
  const initialState = getStateById(initialStateId);
  const left = pickedLeft !== undefined ? pickedLeft : initialState ? { type: "state" as const, state: initialState } : null;

  const t = useTranslations("Compare");
  const slots = [
    { label: t("item1"), placeholder: t("placeholder1"), set: setLeft },
    { label: t("item2"), placeholder: t("placeholder2"), set: setRight },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/compare" }]} />

      <main id="main" className="mx-auto max-w-7xl px-6 py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-8">
          <h1 className="text-display mb-3 text-text-primary">{t("title")}</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">{t("intro")}</p>
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
          <section className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CompareColumn item={left} side="left" />
            <CompareColumn item={right} side="right" />
          </section>
        )}

        {left && right && <Comparison left={left} right={right} />}
      </main>
      <Footer />
    </div>
  );
}
