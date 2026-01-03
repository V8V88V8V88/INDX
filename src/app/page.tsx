"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Header, MetricCard, IndiaMap, MetricSelector } from "@/components";
import { states, india } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import type { State } from "@/types";

type MetricKey = keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area">;
type SortOrder = "desc" | "asc" | "alpha";

// Helper function to get color scale for legend (matches IndiaMap component)
function getColorScale(metric: MetricKey): string[] {
  if (metric === "sexRatio") {
    return ["#fce7f3", "#fbcfe8", "#f472b6", "#db2777", "#be185d"];
  } else if (metric === "area") {
    return ["#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6"];
  } else if (metric === "hdi" || metric === "literacyRate") {
    return ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6"];
  } else if (metric === "density" || metric === "population" || metric === "gdp") {
    return ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e"];
  }
  // Default (Stone)
  return ["#f5f5f4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e"];
}

export default function Home() {
  const [mapMetric, setMapMetric] = useState<MetricKey>("population");
  const [rankingMetric, setRankingMetric] = useState<MetricKey>("population");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { formatPopulation, formatCurrency, formatDensity, formatArea } = useFormat();

  const rankingMetrics: { key: MetricKey; label: string; format: (s: State) => string }[] = useMemo(() => [
    { key: "population", label: "Population", format: (s) => formatPopulation(s.population) },
    { key: "gdp", label: "GDP", format: (s) => formatCurrency(s.gdp * 10000000) }, // gdp in crores * 1cr = INR
    { key: "literacyRate", label: "Literacy", format: (s) => s.literacyRate + "%" },
    { key: "hdi", label: "HDI", format: (s) => s.hdi.toFixed(3) },
    { key: "density", label: "Density", format: (s) => formatDensity(s.density) },
    { key: "sexRatio", label: "Sex Ratio", format: (s) => s.sexRatio.toString() },
    { key: "area", label: "Area", format: (s) => formatArea(s.area) },
  ], [formatPopulation, formatCurrency, formatDensity, formatArea]);

  const totalStates = states.length;
  const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);
  const avgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const avgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;

  const currentRankingConfig = rankingMetrics.find((m) => m.key === rankingMetric)!;

  const rankedStates = useMemo(() => {
    const sorted = [...states];
    if (sortOrder === "alpha") {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "asc") {
      return sorted.sort((a, b) => a[rankingMetric] - b[rankingMetric]);
    } else {
      return sorted.sort((a, b) => b[rankingMetric] - a[rankingMetric]);
    }
  }, [rankingMetric, sortOrder]);

  const maxValue = Math.max(...states.map((s) => s[rankingMetric]));

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-white">
              2026 Data
            </span>
          </div>
          <h1 className="text-display mb-4 text-text-primary">India</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Geographic and statistical data visualization. Explore {totalStates} states and union territories,{" "}
            {totalCities}+ cities with comprehensive demographic and economic indicators.
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
            <MetricSelector selected={mapMetric} onSelect={setMapMetric} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                    onClick={() => setRankingMetric(m.key)}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                <motion.a
                  key={state.id}
                  href={`/state/${state.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.5) }}
                  className="group relative block break-inside-avoid rounded-xl border border-border-light bg-bg-secondary/30 p-3 hover:bg-bg-secondary overflow-hidden"
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
                      animate={{ width: `${(state[rankingMetric] / maxValue) * 100}%` }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.5) }}
                      className="h-full bg-accent-primary/60"
                    />
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </section>

        {/* All States Grid */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-headline text-text-primary">All States & UTs</h2>
            <p className="text-sm text-text-muted">{totalStates} regions</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {states.map((state, index) => (
              <motion.a
                key={state.id}
                href={`/state/${state.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.02 * Math.min(index, 16) }}
                whileHover={{ y: -4 }}
                className="card card-interactive p-5"
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
              </motion.a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-light py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary">
                <span className="text-xs font-bold text-white">IX</span>
              </div>
              <span className="font-semibold text-text-primary">INDX</span>
            </div>
            <p className="text-sm text-text-muted">Data visualization platform · Built for analytical exploration</p>
            <div className="flex flex-col items-end gap-1 sm:items-center">
              <p className="text-sm text-text-muted">© 2026 INDX</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <p className="text-sm text-text-muted">
              Made with <span className="text-accent-primary">❤️</span> by{" "}
              <a href="https://v8v88v8v88.com/" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                Vaibhav Pratap Singh
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
