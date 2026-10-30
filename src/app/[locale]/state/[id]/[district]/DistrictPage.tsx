"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Footer, Header, PlaceBadges, SourcesInfo, StateMap } from "@/components";
import { Badge, Icon, LinkButton, SectionHeader } from "@/components/ui";
import { getStateById } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { Link, useRouter } from "@/i18n/navigation";
import type { DistrictProfile } from "@/lib/district-data";
import { cn } from "@/lib/cn";
import { districtPath } from "@/lib/districts";
import { reveal } from "@/lib/motion";

interface DistrictPageProps {
  stateId: string;
  profile: DistrictProfile;
  names: Record<string, string>;
}

export function DistrictPage({ stateId, profile, names }: DistrictPageProps) {
  const state = getStateById(stateId)!;
  const { district, ranks, stateAverages, indiaAverages, neighbours, odop } = profile;
  const t = useTranslations("District");
  const tOdop = useTranslations("Odop");
  const tDistricts = useTranslations("Districts");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");
  const { stateName, placeName } = usePlaceNames();
  const { formatPopulation, formatArea, formatDensity } = useFormat();
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  const localState = stateName(state.id, state.name);
  const local = (english: string) => names[english] ?? placeName(state.id, english);
  const name = local(district.name);
  const showHeadquarters =
    !!district.headquarters && !district.name.toLowerCase().includes(district.headquarters.toLowerCase());

  const percent = (v: number) => `${v.toFixed(1)}%`;
  const whole = (v: number) => String(Math.round(v));
  const stats = [
    { metric: "population" as const, label: tMetrics("population.short"), value: formatPopulation(district.population) },
    { metric: "density" as const, label: tMetrics("density.short"), value: formatDensity(district.density), average: formatDensity },
    { metric: "literacyRate" as const, label: tMetrics("literacyRate.long"), value: `${district.literacyRate}%`, average: percent },
    { metric: "sexRatio" as const, label: tMetrics("sexRatio.short"), value: String(district.sexRatio), average: whole },
    { metric: "area" as const, label: tMetrics("area.short"), value: formatArea(district.area) },
  ].filter((stat) => district[stat.metric] > 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        breadcrumbs={[
          { label: localState, href: `/state/${state.id}` },
          { label: name, href: districtPath(state.id, district.name) },
        ]}
      />

      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted sm:mb-3">
              <Link href={`/state/${state.id}`} className="transition-colors hover:text-text-primary">
                {t("eyebrow", { state: localState })}
              </Link>
            </p>
            <h1 className="text-display mb-2 text-text-primary sm:mb-3">{name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-base text-text-tertiary sm:text-lg">
              {showHeadquarters && <span>{tDistricts("headquarters", { name: local(district.headquarters!) })}</span>}
              <PlaceBadges isCapital={district.isCapital} isMetro={district.isMetro} tier={district.tier} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LinkButton href={`/compare?a=${encodeURIComponent(`${state.id}/district/${district.name}`)}`} size="sm">
              <Icon name="plus" size={14} />
              {tCommon("compare")}
            </LinkButton>
            <SourcesInfo place={`${district.name}, ${state.name}`}>{tDistricts("infoSources")}</SourcesInfo>
          </div>
        </motion.section>

        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <motion.div {...reveal(reduceMotion, 0.04)} className="order-2 lg:order-none">
            <div className="card divide-y divide-border-light">
              {stats.map((stat) => (
                <div key={stat.metric} className="px-5 py-4">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{stat.value}</p>
                    </div>
                    <div className="shrink-0 space-y-0.5 text-right text-xs leading-5">
                      <p className="flex items-baseline justify-end gap-1.5">
                        <span className="max-w-[8rem] truncate text-text-muted">{localState}</span>
                        <span className="font-medium tabular-nums text-text-secondary">
                          #{ranks[stat.metric].state}
                          <span className="text-text-muted">/{ranks[stat.metric].stateTotal}</span>
                        </span>
                      </p>
                      <p className="flex items-baseline justify-end gap-1.5">
                        <span className="text-text-muted">{tCommon("india")}</span>
                        <span className="font-medium tabular-nums text-text-secondary">
                          #{ranks[stat.metric].india}
                          <span className="text-text-muted">/{ranks[stat.metric].indiaTotal}</span>
                        </span>
                      </p>
                    </div>
                  </div>
                  {stat.average && (
                    <div className="mt-3 space-y-1">
                      {[
                        { place: name, value: district[stat.metric] },
                        { place: localState, value: stateAverages[stat.metric] },
                        { place: tCommon("india"), value: indiaAverages[stat.metric] },
                      ].map((row, i, rows) => {
                        const max = Math.max(...rows.map((r) => r.value));
                        return (
                          <div key={i} className="grid grid-cols-[6rem_1fr_4.5rem] items-center gap-2.5 text-[11px] leading-4">
                            <span className={cn("truncate", i === 0 ? "font-medium text-text-primary" : "text-text-muted")}>{row.place}</span>
                            <div className="h-1 overflow-hidden rounded-full bg-bg-tertiary">
                              <div
                                className={cn("h-full rounded-full", i === 0 ? "bg-accent-primary" : "bg-text-muted/50")}
                                style={{ width: `${max > 0 ? (row.value / max) * 100 : 0}%` }}
                              />
                            </div>
                            <span className={cn("text-right tabular-nums", i === 0 ? "font-medium text-text-primary" : "text-text-tertiary")}>
                              {stat.average(row.value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="card mt-4 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{tOdop("title")}</p>
                <SourcesInfo>DPIIT · ODOP v33, 31 Dec 2025 ·</SourcesInfo>
              </div>
              {odop.length > 0 ? (
                <ul className="mt-2 divide-y divide-border-light">
                  {odop.map((item) => (
                    <li key={item.product} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{item.product}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{tOdop(`categories.${item.category}`)}</p>
                      </div>
                      <Badge className="mt-0.5 shrink-0">{tOdop(`sectors.${item.sector}`)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">{tOdop("none")}</p>
              )}
            </div>
          </motion.div>

          <motion.div {...reveal(reduceMotion, 0.08)} className="order-1 -mx-4 sm:mx-0 lg:order-none lg:col-span-2">
            <StateMap
              stateCode={state.id}
              selectedDistrict={district.name}
              onDistrictSelect={(next) => router.push(next ? districtPath(state.id, next) : `/state/${state.id}`)}
              onDistrictClick={(next) => router.push(districtPath(state.id, next))}
              labelFor={(label) => placeName(state.id, label)}
            />
          </motion.div>
        </div>

        <motion.section {...reveal(reduceMotion, 0.16)} className="mb-12">
          <SectionHeader
            title={t("neighbours")}
            actions={
              <LinkButton href={`/state/${state.id}`} variant="ghost" size="sm">
                {t("allDistricts", { state: localState })}
                <Icon name="arrow-up" size={14} className="rotate-90" />
              </LinkButton>
            }
          />
          {neighbours.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {neighbours.map((neighbour) => (
                <LinkButton key={neighbour} href={districtPath(state.id, neighbour)} size="sm">
                  {local(neighbour)}
                </LinkButton>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">{t("noNeighbours")}</p>
          )}
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
