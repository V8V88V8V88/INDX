"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import { Header, MetricCard, IndiaMap, MetricSelector } from "@/components";
import { states, india } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import type { State } from "@/types";

type MetricKey = keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area">;
type SortOrder = "desc" | "asc" | "alpha";

function getColorScale(metric: MetricKey): string[] {
  if (metric === "sexRatio") {
    return ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
  } else if (metric === "area") {
    return ["var(--choro-0)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-8)"];
  } else if (metric === "hdi" || metric === "literacyRate") {
    return ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
  } else if (metric === "density" || metric === "population" || metric === "gdp") {
    return ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
  }
  return ["var(--choro-0)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-8)"];
}

export default function Home() {
  const [mapMetric, setMapMetric] = useState<MetricKey>("population");
  const [rankingMetric, setRankingMetric] = useState<MetricKey>("population");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAllRegions, setShowAllRegions] = useState(false);
  const { formatPopulation, formatCurrency, formatDensity, formatArea } = useFormat();
  const prefersReducedMotion = useReducedMotion();

  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: "easeOut", type: "tween" };

  // Synchronize map and ranking metrics
  const handleMapMetricChange = (metric: MetricKey) => {
    setMapMetric(metric);
    setRankingMetric(metric);
  };

  const handleRankingMetricChange = (metric: MetricKey) => {
    setRankingMetric(metric);
    setMapMetric(metric);
  };

  const rankingMetrics: { key: MetricKey; label: string; format: (s: State) => string }[] = useMemo(() => [
    { key: "population", label: "Population", format: (s) => formatPopulation(s.population) },
    { key: "gdp", label: "GDP", format: (s) => formatCurrency(s.gdp * 10000000) },
    { key: "literacyRate", label: "Literacy", format: (s) => s.literacyRate + "%" },
    { key: "hdi", label: "HDI", format: (s) => s.hdi.toFixed(3) },
    { key: "density", label: "Density", format: (s) => formatDensity(s.density) },
    { key: "sexRatio", label: "Sex Ratio", format: (s) => s.sexRatio.toString() },
    { key: "area", label: "Area", format: (s) => formatArea(s.area) },
  ], [formatPopulation, formatCurrency, formatDensity, formatArea]);

  const totalStates = 28;
  const totalUTs = 8;
  const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);
  const avgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const avgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;

  const currentRankingConfig = rankingMetrics.find((m) => m.key === rankingMetric)!;

  const rankedStates = useMemo(() => {
    const sorted = [...states];
    if (sortOrder === "alpha") {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "asc") {
      return sorted.sort((a, b) => {
        const aVal = a[rankingMetric] ?? 0;
        const bVal = b[rankingMetric] ?? 0;
        return aVal - bVal;
      });
    } else {
      return sorted.sort((a, b) => {
        const aVal = a[rankingMetric] ?? 0;
        const bVal = b[rankingMetric] ?? 0;
        return bVal - aVal;
      });
    }
  }, [rankingMetric, sortOrder]);

  const maxValue = Math.max(...states.map((s) => {
    const val = s[rankingMetric];
    return val ?? 0;
  }), 1);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smooth}
          className="mb-12"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-white">
              2026 Data
            </span>
          </div>
          <h1 className="text-display mb-4 text-text-primary">India</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Geographic and statistical data visualization. Explore {totalStates} states, {totalUTs} union territories and 733 districts with comprehensive demographic and economic indicators.
          </p>
        </motion.section>

        {/* Summary Cards */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Population" value={formatPopulation(india.population)} subtitle="2026 estimate" delay={0.1} />
          <MetricCard title="States & UTs" value="28 & 8" subtitle={`${totalCities} cities tracked`} delay={0.15} />
          <MetricCard title="Avg Literacy Rate" value={avgLiteracy.toFixed(1)} unit="%" subtitle="Across all states" delay={0.2} />
          <MetricCard title="Avg HDI" value={avgHDI.toFixed(3)} subtitle="Human Development Index" delay={0.25} />
        </section>

        {/* Map Section */}
        <section className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-headline text-text-primary">Interactive Map</h2>
              <p className="text-text-tertiary">Click any state to explore details</p>
            </div>
            <MetricSelector selected={mapMetric} onSelect={handleMapMetricChange} />
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.15 }}
            className="card overflow-hidden p-6"
          >
            <IndiaMap colorByMetric={mapMetric} interactive />

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-xs text-text-muted">Low</span>
              <div className="flex">
                {getColorScale(mapMetric).map((color, i) => (
                  <div key={i} className="h-3 w-8" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-xs text-text-muted">High</span>
              <span className="ml-4 text-xs font-medium text-text-tertiary">
                {mapMetric === "population" && "Population"}
                {mapMetric === "gdp" && "GDP"}
                {mapMetric === "literacyRate" && "Literacy Rate"}
                {mapMetric === "hdi" && "HDI"}
                {mapMetric === "density" && "Density"}
                {mapMetric === "sexRatio" && "Sex Ratio"}
                {mapMetric === "area" && "Area"}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Rankings Section */}
        <section className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-headline text-text-primary">Rankings</h2>
            <div className="flex flex-wrap items-center gap-4">
              {/* Metric Pills */}
              <div className="flex flex-wrap gap-2 rounded-xl bg-bg-secondary p-1.5">
                {rankingMetrics.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleRankingMetricChange(m.key)}
                    className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${rankingMetric === m.key
                      ? "bg-bg-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Sort Order */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortOrder("desc")}
                  title="Highest first"
                  className={`rounded-lg p-2 transition-colors ${sortOrder === "desc" ? "bg-accent-primary text-white" : "text-text-muted hover:bg-bg-secondary"
                    }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSortOrder("asc")}
                  title="Lowest first"
                  className={`rounded-lg p-2 transition-colors ${sortOrder === "asc" ? "bg-accent-primary text-white" : "text-text-muted hover:bg-bg-secondary"
                    }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSortOrder("alpha")}
                  title="Alphabetical"
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition-colors ${sortOrder === "alpha" ? "bg-accent-primary text-white" : "text-text-muted hover:bg-bg-secondary"
                    }`}
                >
                  A-Z
                </button>
              </div>
            </div>
          </div>

          <motion.div
            key={rankingMetric}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, duration: 0.35 }}
            className="card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wider text-text-muted">
                All States & UTs {sortOrder === "alpha" ? "(A-Z)" : `by ${currentRankingConfig.label}`}
              </span>
              <span className="text-xs text-text-muted">{rankedStates.length} regions</span>
            </div>
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 space-y-4">
              {rankedStates.map((state, i) => (
                <Link
                  key={state.id}
                  href={`/state/${state.id}`}
                  className="group relative block break-inside-avoid rounded-xl border border-border-light bg-bg-secondary/30 p-3 hover:bg-bg-secondary overflow-hidden transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-right text-sm font-semibold text-text-muted">{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                        {state.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-text-secondary">{currentRankingConfig.format(state)}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-tertiary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((state[rankingMetric] ?? 0) / maxValue) * 100}%` }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.5) }}
                      className="h-full bg-accent-primary/60"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </section>

        {/* All States Grid */}
        <section className="mb-12">
          <div className="mb-3">
            <h2 className="text-headline text-text-primary">All States & UTs</h2>
            <p className="text-sm text-text-muted">{totalStates} regions</p>
          </div>

          {!showAllRegions && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAllRegions(true)}
                className="rounded-lg border border-border-light bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                Show all states & union territories
              </button>
            </div>
          )}

          {showAllRegions && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {states.map((state) => (
                <Link
                  key={state.id}
                  href={`/state/${state.id}`}
                  className="card card-interactive p-5 transition-transform hover:-translate-y-1"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-bg-secondary px-2 py-1 text-xs font-medium text-text-muted">
                      {state.region}
                    </span>
                    <span className="font-mono text-xs text-text-muted">{state.code}</span>
                  </div>

                  <h3 className="mb-1 text-lg font-semibold text-text-primary">{state.name}</h3>
                  <p className="mb-4 text-sm text-text-tertiary">Capital: {state.capital}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-text-muted">Population</p>
                      <p className="font-medium text-text-secondary">{formatPopulation(state.population)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Literacy</p>
                      <p className="font-medium text-text-secondary">{state.literacyRate}%</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border-light py-8">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted text-center">Maps, data, and everything in between</p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <p className="text-sm text-text-muted">© 2026 INDX</p>
              <span className="text-text-muted">|</span>
              <Link href="/about" className="text-sm text-accent-primary hover:opacity-80 transition-colors">
                About
              </Link>
                <span className="text-text-muted">|</span>
                <a 
                  href="https://github.com/v8V88V8V88/INDX" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-sm text-accent-primary hover:opacity-80 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Source
                </a>
            </div>
              <p className="text-sm text-text-muted">
              Made with <span className="text-accent-primary">❤️</span> by{" "}
              <a href="https://v8v88v8v88.com/" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                Vaibhav Pratap Singh
              </a>
            </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
