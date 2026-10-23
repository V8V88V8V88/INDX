"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import { Footer, Header, MetricCard, IndiaMap, MetricSelector, PageLoader } from "@/components";
import { Badge, Button, Card, CardTitle, Icon, SectionHeader, SegmentedControl, Stat } from "@/components/ui";
import { states, india } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useMetricFormatter } from "@/hooks/useMetricFormatter";
import { getMetricPaletteIndices } from "@/lib/map-view";
import { getMetric } from "@/lib/metrics";
import type { MetricKey } from "@/types";

type SortOrder = "desc" | "asc" | "alpha";

const sortOptions = [
  { value: "desc", label: <Icon name="arrow-down" size={14} />, title: "Highest first" },
  { value: "asc", label: <Icon name="arrow-up" size={14} />, title: "Lowest first" },
  { value: "alpha", label: "A–Z", title: "Alphabetical" },
] as const;

const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);
const avgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
const avgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;

export default function Home() {
  const [metric, setMetric] = useState<MetricKey>("population");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const { formatPopulation } = useFormat();
  const formatMetric = useMetricFormatter();
  const prefersReducedMotion = useReducedMotion();
  const metricInfo = getMetric(metric);

  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

  useEffect(() => {
    const timer = setTimeout(() => setIsPageReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const rankedStates = useMemo(() => {
    const sorted = [...states];
    if (sortOrder === "alpha") return sorted.sort((a, b) => a.name.localeCompare(b.name));
    const dir = sortOrder === "asc" ? 1 : -1;
    return sorted.sort((a, b) => dir * ((a[metric] ?? 0) - (b[metric] ?? 0)));
  }, [metric, sortOrder]);

  const maxValue = Math.max(...states.map((s) => s[metric] ?? 0), 1);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatePresence>{!isPageReady && <PageLoader />}</AnimatePresence>
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={isPageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={smooth}
          className="mb-12"
        >
          <Badge variant="accent" className="mb-3">2026 Data</Badge>
          <h1 className="text-display mb-4 text-text-primary">India</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Everything about India, plotted on one map. Explore, compare and rank any place in the country.
          </p>
        </motion.section>

        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Population" value={formatPopulation(india.population)} subtitle="2026 estimate" delay={0.1} trigger={isPageReady} />
          <MetricCard title="States & UTs" value="28 & 8" subtitle={`${totalCities} cities tracked`} delay={0.15} trigger={isPageReady} />
          <MetricCard title="Avg Literacy Rate" value={avgLiteracy.toFixed(1)} unit="%" subtitle="Across all states" delay={0.2} trigger={isPageReady} />
          <MetricCard title="Avg HDI" value={avgHDI.toFixed(3)} subtitle="Human Development Index · UNDP 2023" delay={0.25} trigger={isPageReady} />
        </section>

        <section className="mb-12">
          <SectionHeader
            title="Interactive Map"
            description="Click any state to explore details"
            actions={<MetricSelector selected={metric} onSelect={setMetric} />}
          />

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={isPageReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.1 }}
            className="card overflow-hidden p-6"
          >
            <IndiaMap colorByMetric={metric} interactive />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-text-muted">Low</span>
              <div className="flex overflow-hidden rounded-full">
                {getMetricPaletteIndices(metric).map((i) => (
                  <div key={i} className="h-3 w-8" style={{ backgroundColor: `var(--choro-${i})` }} />
                ))}
              </div>
              <span className="text-xs text-text-muted">High</span>
              <span className="ml-4 text-xs font-medium text-text-tertiary">{metricInfo.longLabel}</span>
            </div>
          </motion.div>
        </section>

        <section className="mb-12">
          <SectionHeader
            title="Rankings"
            actions={
              <>
                <MetricSelector selected={metric} onSelect={setMetric} />
                <SegmentedControl label="Sort order" options={sortOptions} value={sortOrder} onChange={setSortOrder} />
              </>
            }
          />

          <Card key={metric} trigger={isPageReady}>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>All States & UTs {sortOrder === "alpha" ? "(A–Z)" : `by ${metricInfo.label}`}</CardTitle>
              <span className="text-xs text-text-muted">{rankedStates.length} regions</span>
            </div>
            <div className="columns-1 gap-4 space-y-3 sm:columns-2 xl:columns-3">
              {rankedStates.map((state, i) => (
                <Link
                  key={state.id}
                  href={`/state/${state.id}`}
                  className="group relative block break-inside-avoid overflow-hidden rounded-full border border-border-light bg-bg-secondary/40 px-4 py-2.5 transition-colors hover:border-border-medium"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((state[metric] ?? 0) / maxValue) * 100}%` }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.5) }}
                    className="absolute inset-y-0 left-0 bg-accent-primary/15 transition-colors group-hover:bg-accent-primary/25"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-text-muted">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-text-primary" title={state.name}>
                        {state.name}
                      </span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs text-text-secondary">
                      {formatMetric(metric, state[metric])}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader
            title="All States & UTs"
            description={`${states.length} regions`}
            actions={
              !showAllRegions && (
                <Button onClick={() => setShowAllRegions(true)}>Show all states & union territories</Button>
              )
            }
          />

          {showAllRegions && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {states.map((state) => (
                <Link key={state.id} href={`/state/${state.id}`} className="card card-interactive p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge>{state.region}</Badge>
                    <span className="font-mono text-xs text-text-muted">{state.code}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-text-primary">{state.name}</h3>
                  <p className="mb-4 text-sm text-text-tertiary">Capital: {state.capital}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat size="sm" label="Population" value={formatPopulation(state.population)} />
                    <Stat size="sm" label="Literacy" value={`${state.literacyRate}%`} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
