"use client";

import { use, useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { notFound } from "next/navigation";
import {
  BarChart,
  ComparisonTable,
  DistrictInfoCard,
  DistrictList,
  Footer,
  Header,
  MetricCard,
  PageLoader,
  StateMap,
} from "@/components";
import { Badge, SectionHeader } from "@/components/ui";
import { getStateById, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useDistricts } from "@/hooks/useDistricts";
import type { District, State } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default function StatePage({ params }: PageProps) {
  const { id } = use(params);
  const state = getStateById(id);
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  const prefersReducedMotion = useReducedMotion();
  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

  const [isPageReady, setIsPageReady] = useState(false);
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

  const nationalAvgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const nationalAvgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;
  const nationalAvgDensity = states.reduce((sum, s) => sum + s.density, 0) / states.length;
  const nationalAvgGDP = states.reduce((sum, s) => sum + s.gdp, 0) / states.length;

  const populationRank = states.filter((s) => s.population > state.population).length + 1;
  const gdpRank = states.filter((s) => s.gdp > state.gdp).length + 1;
  const literacyRank = states.filter((s) => s.literacyRate > state.literacyRate).length + 1;
  const hdiRank = states.filter((s) => s.hdi > state.hdi).length + 1;

  const majorAreasByPopulation = useMemo(() => {
    if (districts && districts.length > 0) {
      const districtData = [...districts]
        .sort((a, b) => b.population - a.population)
        .slice(0, 5)
        .map((district) => {
          const matchedCity = state.cities.find(
            (c) =>
              normalizeDistrictName(c.name) === normalizeDistrictName(district.name) ||
              normalizeDistrictName(c.name) === normalizeDistrictName(district.headquarters || "")
          );

          return {
            name: district.name,
            value: district.population,
            displayValue: formatPopulation(district.population),
            highlight: !!(matchedCity?.isCapital || district.isCapital),
          };
        });

      if (districtData.length > 0) {
        return districtData;
      }
    }

    if (state.cities && state.cities.length > 0) {
      return [...state.cities]
        .sort((a, b) => b.population - a.population)
        .slice(0, 5)
        .map((city) => ({
          name: city.name,
          value: city.population,
          displayValue: formatPopulation(city.population),
          highlight: city.isCapital || false,
        }));
    }

    return [];
  }, [districts, state.cities, formatPopulation]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatePresence>
        {!isPageReady && <PageLoader />}
      </AnimatePresence>

      <Header
        breadcrumbs={[{ label: state.name, href: `/state/${state.id}` }]}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={isPageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={smooth}
          className="mb-8"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{state.region} India</Badge>
            <Badge variant="outline">{state.code}</Badge>
          </div>
          <h1 className="text-display mb-3 text-text-primary">{state.name}</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Capital:{" "}
            <button
              onClick={() => selectDistrict(findCapitalDistrict(state, districts))}
              className="text-text-secondary transition-colors hover:text-accent-primary hover:underline"
            >
              {state.capital}
            </button>
            {" · "}
            {formatArea(state.area)} area
          </p>
        </motion.section>

        {/* Metrics & Map Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Metrics */}
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            {/* Key Metrics Grid */}
            <div className="order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:order-none lg:grid-cols-1 lg:gap-3">
              <MetricCard
                title="Population (2026)"
                value={formatPopulation(state.population)}
                subtitle={`#${populationRank} in India`}
                delay={0.1}
                trigger={isPageReady}
              />
              <MetricCard
                title={state.gdpYear ? `GSDP (${state.gdpYear})` : "GSDP"}
                value={formatCurrency(state.gdp * 10000000)}
                unit=""
                subtitle={`#${gdpRank} in India · ${formatCurrency(Math.round((state.gdp * 10000000) / state.population))} per person`}
                delay={0.15}
                trigger={isPageReady}
              />
              <MetricCard
                title="Literacy Rate"
                value={state.literacyRate}
                unit="%"
                subtitle={`#${literacyRank} in India`}
                delay={0.2}
                trigger={isPageReady}
              />
              <MetricCard
                title="HDI"
                value={state.hdi.toFixed(3)}
                subtitle={`#${hdiRank} in India`}
                delay={0.25}
                trigger={isPageReady}
              />
            </div>

            <div className="order-3 lg:order-none">
              <AnimatePresence mode="wait" initial={false}>
                {selectedDistrict && (
                  <DistrictInfoCard
                    key={selectedDistrict}
                    district={selectedDistrictInfo}
                    districtName={selectedDistrict}
                    onClose={() => selectDistrict(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Map - Now takes full column */}
          <div id="state-map" className="order-2 -mt-4 lg:order-none lg:col-span-2">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={isPageReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
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
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Comparison and Charts Row */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComparisonTable
            title="vs National Average"
            columns={[state.name, "National Avg"]}
            delay={0.15}
            trigger={isPageReady}
            rows={[
              {
                label: "Literacy Rate",
                values: [`${state.literacyRate.toFixed(1)}%`, `${nationalAvgLiteracy.toFixed(1)}%`],
                winner: state.literacyRate > nationalAvgLiteracy ? 0 : 1,
              },
              {
                label: "HDI",
                values: [state.hdi.toFixed(3), nationalAvgHDI.toFixed(3)],
                winner: state.hdi > nationalAvgHDI ? 0 : 1,
              },
              {
                label: "Density",
                values: [formatDensity(state.density), formatDensity(Math.round(nationalAvgDensity))],
              },
              {
                label: "GDP",
                values: [formatCurrency(state.gdp * 10000000), formatCurrency(Math.round(nationalAvgGDP) * 10000000)],
                winner: state.gdp > nationalAvgGDP ? 0 : 1,
              },
            ]}
          />

          <BarChart
            title="Cities by Population"
            delay={0.18}
            trigger={isPageReady}
            items={majorAreasByPopulation}
          />
        </section>


        <section className="mb-12" data-districts-section>
          <SectionHeader
            title="Districts"
            description={`Administrative divisions of ${state.name}`}
          />
          <DistrictList
            stateCode={state.id}
            stateName={state.name}
            cities={state.cities}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={(d) => selectDistrict(d)}
          />
        </section>

      </main>
      <Footer />
    </div>
  );
}