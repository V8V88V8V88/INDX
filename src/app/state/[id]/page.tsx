"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, MetricCard } from "@/components";
import { BarChart } from "@/components/BarChart";
import { CityCard } from "@/components/CityCard";
import { StatComparison } from "@/components/StatComparison";
import { getStateById, states, formatPopulation, formatNumber } from "@/data/india";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StatePage({ params }: PageProps) {
  const { id } = use(params);
  const state = getStateById(id);

  if (!state) {
    notFound();
  }

  // Calculate national averages
  const nationalAvgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const nationalAvgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;
  const nationalAvgDensity = states.reduce((sum, s) => sum + s.density, 0) / states.length;
  const nationalAvgGDP = states.reduce((sum, s) => sum + s.gdp, 0) / states.length;

  // State rank calculations
  const populationRank = states.filter((s) => s.population > state.population).length + 1;
  const gdpRank = states.filter((s) => s.gdp > state.gdp).length + 1;
  const literacyRank = states.filter((s) => s.literacyRate > state.literacyRate).length + 1;
  const hdiRank = states.filter((s) => s.hdi > state.hdi).length + 1;

  // City data for charts
  const citiesByPopulation = [...state.cities].sort((a, b) => b.population - a.population);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        breadcrumbs={[{ label: state.name, href: `/state/${state.id}` }]}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent-primary">
              {state.region} India
            </span>
            <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-muted">
              {state.code}
            </span>
          </div>
          <h1 className="text-display mb-3 text-text-primary">{state.name}</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Capital: <span className="text-text-secondary">{state.capital}</span>
            {" · "}
            {state.cities.length} major cities tracked
            {" · "}
            {formatNumber(state.area)} km² area
          </p>
        </motion.section>

        {/* Key Metrics */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Population"
            value={formatPopulation(state.population)}
            subtitle={`#${populationRank} in India`}
            delay={0.1}
          />
          <MetricCard
            title="GDP"
            value={formatNumber(state.gdp)}
            unit="Cr"
            subtitle={`#${gdpRank} in India`}
            delay={0.15}
          />
          <MetricCard
            title="Literacy Rate"
            value={state.literacyRate}
            unit="%"
            subtitle={`#${literacyRank} in India`}
            delay={0.2}
          />
          <MetricCard
            title="HDI"
            value={state.hdi.toFixed(3)}
            subtitle={`#${hdiRank} in India`}
            delay={0.25}
          />
        </section>

        {/* Comparison and Charts Row */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatComparison
            title="vs National Average"
            stateName={state.name}
            delay={0.3}
            items={[
              {
                label: "Literacy Rate",
                stateValue: state.literacyRate.toFixed(1),
                nationalValue: nationalAvgLiteracy.toFixed(1),
                unit: "%",
                higher: state.literacyRate > nationalAvgLiteracy ? "state" : "national",
              },
              {
                label: "HDI",
                stateValue: state.hdi.toFixed(3),
                nationalValue: nationalAvgHDI.toFixed(3),
                higher: state.hdi > nationalAvgHDI ? "state" : "national",
              },
              {
                label: "Density",
                stateValue: state.density.toLocaleString(),
                nationalValue: Math.round(nationalAvgDensity).toLocaleString(),
                unit: "/km²",
                higher: null,
              },
              {
                label: "GDP",
                stateValue: formatNumber(state.gdp),
                nationalValue: formatNumber(Math.round(nationalAvgGDP)),
                unit: " Cr",
                higher: state.gdp > nationalAvgGDP ? "state" : "national",
              },
            ]}
          />

          <BarChart
            title="Cities by Population"
            delay={0.35}
            items={citiesByPopulation.slice(0, 6).map((city) => ({
              name: city.name,
              value: city.population,
              displayValue: formatPopulation(city.population),
              highlight: city.isCapital,
            }))}
          />
        </section>

        {/* Additional Metrics */}
        <section className="mb-10">
          <div className="card p-6">
            <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-muted">
              Geographic & Demographic Data
            </h3>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <p className="mb-1 text-xs text-text-muted">Total Area</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatNumber(state.area)}
                </p>
                <p className="text-xs text-text-muted">sq km</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Density</p>
                <p className="text-xl font-semibold text-text-primary">
                  {state.density.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">per sq km</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Major Cities</p>
                <p className="text-xl font-semibold text-text-primary">
                  {state.cities.length}
                </p>
                <p className="text-xs text-text-muted">tracked</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Tier 1 Cities</p>
                <p className="text-xl font-semibold text-text-primary">
                  {state.cities.filter((c) => c.tier === 1).length}
                </p>
                <p className="text-xs text-text-muted">metros</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Urban Pop.</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatPopulation(
                    state.cities.reduce((sum, c) => sum + c.population, 0)
                  )}
                </p>
                <p className="text-xs text-text-muted">in tracked cities</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Per Capita GDP</p>
                <p className="text-xl font-semibold text-text-primary">
                  ₹{Math.round((state.gdp * 10000000) / state.population).toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">approx</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cities Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-headline text-text-primary">Cities</h2>
              <p className="text-text-tertiary">
                Major urban centers in {state.name}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-md bg-accent-primary px-2 py-1 text-xs font-medium text-white">
                {state.cities.filter((c) => c.tier === 1).length} Tier 1
              </span>
              <span className="rounded-md bg-accent-muted px-2 py-1 text-xs font-medium text-accent-primary">
                {state.cities.filter((c) => c.tier === 2).length} Tier 2
              </span>
              <span className="rounded-md bg-bg-tertiary px-2 py-1 text-xs font-medium text-text-muted">
                {state.cities.filter((c) => c.tier === 3).length} Tier 3
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {citiesByPopulation.map((city, index) => (
              <CityCard
                key={city.id}
                city={city}
                stateName={state.name}
                delay={0.05 * index}
              />
            ))}
          </div>
        </section>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to India
          </Link>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border-light py-8">
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
          </div>
        </footer>
      </main>
    </div>
  );
}

