"use client";

import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { EASE_OUT, FADE_DURATION } from "@/lib/motion";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ComparisonTable,
  DistrictInfoCard,
  DistrictList,
  Footer,
  Header,
  MetricCard,
  PageLoader,
  SourcesInfo,
  StateMap,
} from "@/components";
import type { SortType } from "@/components/DistrictList";
import { Icon, LinkButton, SectionHeader } from "@/components/ui";
import { getStateById, nationalStats, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useDistricts } from "@/hooks/useDistricts";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { colorIndexForRank, getMetricPaletteIndices, type MapMetric } from "@/lib/map-view";
import { DISTRICT_SOURCES, METRIC_SOURCES } from "@/lib/metrics";
import type { District, State } from "@/types";

function normalizeDistrictName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’'".,()/]/g, "")
    .replace(/&/g, "and");
}

function findDistrictByName(list: District[], name: string): District | null {
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

function findCapitalDistrict(state: State, districts: District[] | undefined): string {
  if (!state.capitalDistrict) return state.capital;
  return (districts && findDistrictByName(districts, state.capitalDistrict)?.name) || state.capitalDistrict;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

function setHash(hash: string | null) {
  if (hash) {
    if (window.location.hash !== hash) window.location.hash = hash;
  } else if (window.location.hash) {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

function selectionFromHash(hash: string, state: State, districts: District[] | undefined): string | null {
  if (hash.startsWith("#city-")) {
    return state.cities.find((c) => c.id === hash.slice("#city-".length))?.name ?? null;
  }
  if (hash.startsWith("#district-")) {
    let name: string;
    try {
      name = decodeURIComponent(hash.slice("#district-".length));
    } catch {
      return null;
    }
    if (!name) return null;
    return (districts && findDistrictByName(districts, name)?.name) || name;
  }
  return null;
}

export function StatePage({ id }: { id: string }) {
  const state = getStateById(id);
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  const t = useTranslations("State");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");
  const tRegions = useTranslations("Regions");
  const { stateName, capitalName, placeName } = usePlaceNames();
  const prefersReducedMotion = useReducedMotion();
  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: FADE_DURATION, ease: EASE_OUT };

  const [isPageReady, setIsPageReady] = useState(false);
  const [mapSort, setMapSort] = useState<SortType>("population");
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const skipScrollHashRef = useRef<string | null>(null);
  const lastScrolledHashRef = useRef<string | null>(null);

  if (!state) {
    notFound();
  }

  const { data: districts } = useDistricts(state.id);

  useEffect(() => {
    // Smart Pre-load:
    // We delay the "ready" state slightly to allowing heavy components (Map, Charts)
    // to hydrate and render their initial frame BEHIND the loader.
    // This ensures that when the loader fades out, the UI is fully painted and 60fps smooth.
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const selectedDistrict = useMemo(
    () => selectionFromHash(hash, state, districts),
    [hash, state, districts],
  );

  const selectDistrict = (name: string | null, { scroll = false } = {}) => {
    const next = name ? `#district-${encodeURIComponent(name)}` : null;
    if (next && !scroll && next !== window.location.hash) skipScrollHashRef.current = next;
    setHash(next);
  };

  useEffect(() => {
    if (!hash) {
      lastScrolledHashRef.current = null;
      return;
    }
    if (!isPageReady || hash === lastScrolledHashRef.current) return;
    if (!hash.startsWith("#city-") && !hash.startsWith("#district-")) return;
    if (skipScrollHashRef.current === hash) {
      skipScrollHashRef.current = null;
      lastScrolledHashRef.current = hash;
      return;
    }

    const timer = setTimeout(() => {
      lastScrolledHashRef.current = hash;
      document.getElementById("state-map")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 200);
    return () => clearTimeout(timer);
  }, [hash, isPageReady]);

  const selectedDistrictInfo = useMemo(() => {
    if (!selectedDistrict || !districts || districts.length === 0) return null;

    return findDistrictByName(districts, selectedDistrict);
  }, [selectedDistrict, districts]);

  const mapMetric: MapMetric | null = mapSort === "name" ? null : mapSort === "literacy" ? "literacyRate" : mapSort;

  const districtFill = useMemo(() => {
    if (!mapMetric || !districts?.length) return undefined;
    const ranked = districts.filter((d) => d[mapMetric] > 0).sort((a, b) => b[mapMetric] - a[mapMetric]);
    const palette = getMetricPaletteIndices(mapMetric).map((i) => `var(--choro-${i})`);
    const colors = new Map(ranked.map((d, i) => [d.name, palette[colorIndexForRank(i, ranked.length, palette.length)]]));
    return (name: string) => {
      const district = findDistrictByName(districts, name);
      return district ? colors.get(district.name) : undefined;
    };
  }, [districts, mapMetric]);

  const populationRank = states.filter((s) => s.population > state.population).length + 1;
  const gdpRank = states.filter((s) => s.gdp > state.gdp).length + 1;
  const literacyRank = states.filter((s) => s.literacyRate > state.literacyRate).length + 1;
  const hdiRank = states.filter((s) => s.hdi > state.hdi).length + 1;


  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatePresence>
        {!isPageReady && <PageLoader />}
      </AnimatePresence>

      <Header
        breadcrumbs={[{ label: stateName(state.id, state.name), href: `/state/${state.id}` }]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero Section */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={isPageReady ? { opacity: 1 } : { opacity: 0 }}
          transition={smooth}
          className="mb-4 sm:mb-8"
        >
          <p className="mb-2 sm:mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            {tRegions("ofIndia", { region: state.region })} · {state.code}
          </p>
          <h1 className="text-display mb-2 sm:mb-3 text-text-primary">{stateName(state.id, state.name)}</h1>
          <p className="max-w-2xl text-base sm:text-lg text-text-tertiary">
            {t("capital")}{" "}
            <button
              onClick={() => selectDistrict(findCapitalDistrict(state, districts))}
              className="text-text-secondary transition-colors hover:text-accent-primary hover:underline"
            >
              {capitalName(state.id, state.capital)}
            </button>
            {" · "}
            {t("area", { area: formatArea(state.area) })}
          </p>
        </motion.section>

        {/* Metrics & Map Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Metrics */}
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            {/* Key Metrics Grid */}
            <div className="order-2 grid grid-cols-2 gap-3 sm:gap-4 lg:order-none lg:grid-cols-1 lg:gap-3">
              <MetricCard
                title={t("populationYear", { year: 2026 })}
                value={formatPopulation(state.population)}
                subtitle={tCommon("rankInIndia", { rank: populationRank })}
                source={METRIC_SOURCES.population}
                delay={0.1}
                trigger={isPageReady}
              />
              <MetricCard
                title={state.gdpYear ? tMetrics("gsdpYear", { year: state.gdpYear }) : tMetrics("gsdp")}
                value={formatCurrency(state.gdp * 10000000, state.gdpYear)}
                unit=""
                subtitle={t("rankWithPerPerson", { rank: gdpRank, value: formatCurrency(state.gdpPerCapita, state.gdpYear) })}
                source={METRIC_SOURCES.gdp}
                delay={0.15}
                trigger={isPageReady}
              />
              <MetricCard
                title={tMetrics("literacyRate.long")}
                value={state.literacyRate}
                unit="%"
                subtitle={tCommon("rankInIndia", { rank: literacyRank })}
                source={METRIC_SOURCES.literacyRate}
                delay={0.2}
                trigger={isPageReady}
              />
              <MetricCard
                title={tMetrics("hdi.short")}
                value={state.hdi.toFixed(3)}
                subtitle={tCommon("rankInIndia", { rank: hdiRank })}
                source={METRIC_SOURCES.hdi}
                delay={0.25}
                trigger={isPageReady}
              />
            </div>

            <LinkButton href={`/compare?a=${state.id}`} size="sm" className="order-2 justify-self-center lg:order-none lg:self-center">
              <Icon name="plus" size={14} />
              {tCommon("compare")}
            </LinkButton>
          </div>

          {/* Right Column: Map - Now takes full column */}
          <div id="state-map" className="relative order-1 -mx-4 sm:mx-0 lg:order-none lg:col-span-2 lg:-mt-32">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={isPageReady ? { opacity: 1 } : { opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.1 }}
              className="flex flex-col items-center justify-center"
              style={{ overflow: "visible" }}
            >
              <div className="w-full" style={{ overflow: "visible" }}>
                <StateMap
                  stateCode={state.id}
                  selectedDistrict={selectedDistrict}
                  onDistrictSelect={(d) => selectDistrict(d)}
                  onDistrictClick={(d) =>
                    selectDistrict((districts && findDistrictByName(districts, d)?.name) || d)
                  }
                  districtFill={districtFill}
                  labelFor={(name) => placeName(state.id, name)}
                />
              </div>
            </motion.div>

            {mapMetric && districtFill && !selectedDistrict && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-text-muted">{tCommon("low")}</span>
                <div className="flex overflow-hidden rounded-full">
                  {getMetricPaletteIndices(mapMetric).map((i) => (
                    <div key={i} className="h-3 w-8" style={{ backgroundColor: `var(--choro-${i})` }} />
                  ))}
                </div>
                <span className="text-xs text-text-muted">{tCommon("high")}</span>
                <span className="ml-4 text-xs font-medium text-text-tertiary">{tMetrics(`${mapMetric}.long`)}</span>
                {mapMetric in DISTRICT_SOURCES && (
                  <span className="text-xs text-text-muted">{DISTRICT_SOURCES[mapMetric as keyof typeof DISTRICT_SOURCES]}</span>
                )}
              </div>
            )}

            <div className="mx-4 mt-3 sm:mx-0 lg:absolute lg:inset-x-0 lg:bottom-6 lg:z-10 lg:mx-auto lg:mt-0 lg:w-full lg:max-w-md">
              <AnimatePresence mode="wait" initial={false}>
                {selectedDistrict && (
                  <DistrictInfoCard
                    key={selectedDistrict}
                    district={selectedDistrictInfo}
                    districtName={selectedDistrict}
                    onClose={() => selectDistrict(null)}
                    className="lg:bg-bg-card/85 lg:shadow-lg lg:backdrop-blur-md"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <section className="relative mb-10">
          <ComparisonTable
            columns={[stateName(state.id, state.name), tCommon("india")]}
            delay={0.15}
            trigger={isPageReady}
            rows={[
              {
                label: tMetrics("literacyRate.long"),
                values: [`${state.literacyRate.toFixed(1)}%`, `${nationalStats.literacyRate.toFixed(1)}%`],
                winner: state.literacyRate > nationalStats.literacyRate ? 0 : 1,
              },
              {
                label: tMetrics("hdi.short"),
                values: [state.hdi.toFixed(3), nationalStats.hdi.toFixed(3)],
                winner: state.hdi > nationalStats.hdi ? 0 : 1,
              },
              {
                label: tMetrics("density.short"),
                values: [formatDensity(state.density), formatDensity(nationalStats.density)],
              },
              {
                label: tMetrics("gdpPerCapita.long"),
                values: [formatCurrency(state.gdpPerCapita, state.gdpYear), formatCurrency(nationalStats.gdpPerCapita, nationalStats.gdpYear)],
                winner: state.gdpPerCapita > nationalStats.gdpPerCapita ? 0 : 1,
              },
            ]}
          />
          <SourcesInfo className="absolute right-0 top-2" place={state.name}>
            {t("sources")}
          </SourcesInfo>
        </section>


        <section className="mb-12" data-districts-section>
          <SectionHeader
            title={t("districts")}
            description={t("districtsDescription", { name: stateName(state.id, state.name) })}
          />
          <DistrictList
            stateCode={state.id}
            stateName={stateName(state.id, state.name)}
            cities={state.cities}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={(d) => selectDistrict(d)}
            onSortChange={setMapSort}
          />
        </section>

      </main>
      <Footer />
    </div>
  );
}