"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header, MetricCard, RankedList, IndiaMap, MetricSelector } from "@/components";
import { states, india, formatPopulation, formatNumber, getTopStatesByMetric } from "@/data/india";
import type { State } from "@/types";

type MetricKey = keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density">;

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("population");

  const topByPopulation = getTopStatesByMetric("population", 8);
  const topByGDP = getTopStatesByMetric("gdp", 8);
  const topByHDI = getTopStatesByMetric("hdi", 8);
  const topByLiteracy = getTopStatesByMetric("literacyRate", 8);

  const maxPopulation = Math.max(...states.map((s) => s.population));
  const maxGDP = Math.max(...states.map((s) => s.gdp));

  const totalStates = states.length;
  const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);
  const avgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const avgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent-primary">
              Phase 1
            </span>
          </div>
          <h1 className="text-display mb-4 text-text-primary">
            India
          </h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Geographic and statistical data visualization. 
            Explore {totalStates} states and union territories, {totalCities}+ cities with comprehensive demographic and economic indicators.
          </p>
        </motion.section>

        {/* Summary Cards */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Population"
            value={formatPopulation(india.population)}
            subtitle="2026 estimate"
            delay={0.1}
          />
          <MetricCard
            title="States & UTs"
            value={totalStates}
            subtitle={`${totalCities} cities tracked`}
            delay={0.15}
          />
          <MetricCard
            title="Avg Literacy Rate"
            value={avgLiteracy.toFixed(1)}
            unit="%"
            subtitle="Across all states"
            delay={0.2}
          />
          <MetricCard
            title="Avg HDI"
            value={avgHDI.toFixed(3)}
            subtitle="Human Development Index"
            delay={0.25}
          />
        </section>

        {/* Map and Controls */}
        <section className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-headline text-text-primary">Interactive Map</h2>
              <p className="text-text-tertiary">Click any state to explore details</p>
            </div>
            <MetricSelector selected={selectedMetric} onSelect={setSelectedMetric} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card overflow-hidden p-6"
          >
            <IndiaMap colorByMetric={selectedMetric} interactive />
            
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-xs text-text-muted">Low</span>
              <div className="flex">
                {["#f5f5f4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e"].map((color, i) => (
                  <div
                    key={i}
                    className="h-3 w-8"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">High</span>
              <span className="ml-4 text-xs font-medium text-text-tertiary">
                {selectedMetric === "population" && "Population"}
                {selectedMetric === "gdp" && "GDP"}
                {selectedMetric === "literacyRate" && "Literacy Rate"}
                {selectedMetric === "hdi" && "HDI"}
                {selectedMetric === "density" && "Density"}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Rankings Grid */}
        <section className="mb-12">
          <h2 className="text-headline mb-6 text-text-primary">Rankings</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RankedList
              title="By Population"
              delay={0.1}
              items={topByPopulation.map((s, i) => ({
                rank: i + 1,
                name: s.name,
                value: formatPopulation(s.population),
                href: `/state/${s.id}`,
                barWidth: (s.population / maxPopulation) * 100,
              }))}
            />
            <RankedList
              title="By GDP (₹ Crores)"
              delay={0.15}
              items={topByGDP.map((s, i) => ({
                rank: i + 1,
                name: s.name,
                value: formatNumber(s.gdp),
                href: `/state/${s.id}`,
                barWidth: (s.gdp / maxGDP) * 100,
              }))}
            />
            <RankedList
              title="By HDI"
              delay={0.2}
              items={topByHDI.map((s, i) => ({
                rank: i + 1,
                name: s.name,
                value: s.hdi.toFixed(3),
                href: `/state/${s.id}`,
                barWidth: (s.hdi / 1) * 100,
              }))}
            />
            <RankedList
              title="By Literacy Rate"
              delay={0.25}
              items={topByLiteracy.map((s, i) => ({
                rank: i + 1,
                name: s.name,
                value: `${s.literacyRate}%`,
                href: `/state/${s.id}`,
                barWidth: s.literacyRate,
              }))}
            />
          </div>
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
                transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 12) }}
                whileHover={{ y: -4 }}
                className="card card-interactive p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-bg-secondary px-2 py-1 text-xs font-medium text-text-muted">
                    {state.region}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{state.code}</span>
                </div>
                
                <h3 className="mb-1 text-lg font-semibold text-text-primary">
                  {state.name}
                </h3>
                <p className="mb-4 text-sm text-text-tertiary">
                  Capital: {state.capital}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-muted">Population</p>
                    <p className="font-medium text-text-secondary">
                      {formatPopulation(state.population)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Literacy</p>
                    <p className="font-medium text-text-secondary">
                      {state.literacyRate}%
                    </p>
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
            <p className="text-sm text-text-muted">
              Data visualization platform · Built for analytical exploration
            </p>
            <p className="text-sm text-text-muted">
              © 2026 INDX
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
