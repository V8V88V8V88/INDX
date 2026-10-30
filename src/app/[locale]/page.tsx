"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import { EASE_OUT, FADE_DURATION } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DownloadCsv, EmbedButton, Footer, Header, MetricCard, IndiaMap, MetricSelector, PageLoader, SourcesInfo } from "@/components";
import { Card, Icon, SectionHeader, SegmentedControl } from "@/components/ui";
import { DISTRICT_COUNT, india, nationalStats, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useIndiaGeo } from "@/hooks/useGeo";
import { useSlowLoader } from "@/hooks/useSlowLoader";
import { useMetricFormatter } from "@/hooks/useMetricFormatter";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { useUrlParam } from "@/hooks/useUrlParam";
import { getMetricPaletteIndices, isMapMetric } from "@/lib/map-view";
import { METRIC_SOURCES, REGIONS } from "@/lib/metrics";
import type { MetricKey, State } from "@/types";

type SortOrder = "desc" | "asc" | "alpha";

type RegionFilter = "all" | State["region"];

export default function Home() {
  const t = useTranslations("Home");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");
  const tRegions = useTranslations("Regions");
  const tEmbed = useTranslations("Embed");
  const { stateName } = usePlaceNames();

  const sortOptions = [
    { value: "desc", label: <Icon name="arrow-down" size={14} />, title: t("highestFirst") },
    { value: "asc", label: <Icon name="arrow-up" size={14} />, title: t("lowestFirst") },
    { value: "alpha", label: tCommon("sortAZ"), title: t("alphabetical") },
  ] as const;

  const regionOptions: { value: RegionFilter; label: string }[] = [
    { value: "all", label: tRegions("all") },
    ...REGIONS.map((r) => ({ value: r, label: tRegions(r) })),
  ];

  const [metric, setMetric] = useUrlParam<MetricKey>("m", "population", isMapMetric);
  const [sortOrder, setSortOrder] = useUrlParam<SortOrder>("sort", "desc", (v) => v === "asc" || v === "alpha");
  const [region, setRegion] = useUrlParam<RegionFilter>("region", "all", (v) => (REGIONS as readonly string[]).includes(v));
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const isPageReady = !useIndiaGeo().isPending;
  const showLoader = useSlowLoader(isPageReady);
  const { formatPopulation } = useFormat();
  const formatMetric = useMetricFormatter();
  const prefersReducedMotion = useReducedMotion();

  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: FADE_DURATION, ease: EASE_OUT };

  const rankedStates = useMemo(() => {
    const sorted = [...states];
    if (sortOrder === "alpha") return sorted.sort((a, b) => stateName(a.id).localeCompare(stateName(b.id)));
    const dir = sortOrder === "asc" ? 1 : -1;
    return sorted.sort((a, b) => dir * ((a[metric] ?? 0) - (b[metric] ?? 0)));
  }, [metric, sortOrder, stateName]);

  const maxValue = Math.max(...states.map((s) => s[metric] ?? 0), 1);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatePresence>{showLoader && <PageLoader />}</AnimatePresence>
      <Header />

      <main id="main" className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={isPageReady ? { opacity: 1 } : { opacity: 0 }}
              transition={smooth}
              className="mb-6"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{t("eyebrow", { year: 2026 })}</p>
              <h1 className="text-display mb-4 text-text-primary">{t("title")}</h1>
              <p className="text-lg text-text-tertiary">{t("intro")}</p>
            </motion.div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 lg:gap-3">
              <MetricCard title={t("totalPopulation")} value={formatPopulation(india.population)} subtitle={t("estimate", { year: 2026 })} delay={0.1} trigger={isPageReady} />
              <MetricCard title={t("statesAndUts")} value={t("statesAndUtsValue", { states: 28, uts: 8 })} subtitle={t("districtCount", { count: DISTRICT_COUNT })} delay={0.15} trigger={isPageReady} />
              <MetricCard title={tMetrics("literacyRate.long")} value={nationalStats.literacyRate.toFixed(1)} unit="%" subtitle="PLFS 2023-24" delay={0.2} trigger={isPageReady} />
              <MetricCard title={tMetrics("hdi.short")} value={nationalStats.hdi.toFixed(3)} subtitle={t("hdiSubtitle")} delay={0.25} trigger={isPageReady} />
            </div>
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={isPageReady ? { opacity: 1 } : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.1 }}
            className="min-w-0 lg:col-span-2 lg:self-center"
          >
            <IndiaMap
              colorByMetric={metric}
              selectedState={hoveredState}
              interactive
              extraControls={
                <EmbedButton
                  path="/embed/map"
                  query={{ m: metric }}
                  title={tEmbed("frameTitle", { place: tCommon("india"), metric: tMetrics(`${metric}.long`) })}
                />
              }
            />

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-text-muted">{tCommon("low")}</span>
              <div className="flex overflow-hidden rounded-full">
                {getMetricPaletteIndices(metric).map((i) => (
                  <div key={i} className="h-3 w-8" style={{ backgroundColor: `var(--choro-${i})` }} />
                ))}
              </div>
              <span className="text-xs text-text-muted">{tCommon("high")}</span>
              <span className="ml-4 text-xs font-medium text-text-tertiary">{tMetrics(`${metric}.long`)}</span>
              <span className="text-xs text-text-muted">{METRIC_SOURCES[metric]}</span>
            </div>
          </motion.div>
        </section>

        <section className="mb-12">
          <SectionHeader
            title={t("rankings")}
            actions={
              <>
                <MetricSelector selected={metric} onSelect={setMetric} />
                <SegmentedControl label={t("sortOrder")} options={sortOptions} value={sortOrder} onChange={setSortOrder} />
              </>
            }
          />

          <div className="mb-4 flex items-center justify-between gap-3">
            <SegmentedControl label={t("filterByRegion")} size="sm" options={regionOptions} value={region} onChange={setRegion} scrollable />
            <div className="flex shrink-0 items-center">
              <DownloadCsv href="/api/v1/states.csv" />
              <SourcesInfo place="India">{t("sources")}</SourcesInfo>
            </div>
          </div>

          <Card plain key={metric} trigger={isPageReady}>
            <div className="columns-1 gap-4 space-y-3 sm:columns-2 xl:columns-3">
              {rankedStates.map((state, i) => region !== "all" && state.region !== region ? null : (
                <Link
                  key={state.id}
                  href={`/state/${state.id}`}
                  onMouseEnter={() => setHoveredState(state.id)}
                  onMouseLeave={() => setHoveredState(null)}
                  className="group relative block break-inside-avoid overflow-hidden rounded-full border border-border-light bg-bg-secondary/40 px-4 py-2.5 transition-colors hover:border-border-medium"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((state[metric] ?? 0) / maxValue) * 100}%` }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.5) }}
                    className="absolute inset-y-0 left-0 bg-accent-primary/15 transition-colors [mask-image:linear-gradient(to_right,black_85%,transparent)] group-hover:bg-accent-primary/25"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-text-muted">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-text-primary" title={stateName(state.id)}>
                        {stateName(state.id)}
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

      </main>
      <Footer />
    </div>
  );
}
