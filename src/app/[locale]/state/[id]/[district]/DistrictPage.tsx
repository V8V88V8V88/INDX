"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Footer, Header, MetricCard, PlaceBadges, SourcesInfo, StateMap } from "@/components";
import { Badge, Icon, LinkButton, SectionHeader } from "@/components/ui";
import { getStateById } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { Link, useRouter } from "@/i18n/navigation";
import type { DistrictProfile } from "@/lib/district-data";
import { districtPath } from "@/lib/districts";
import { DISTRICT_SOURCES } from "@/lib/metrics";
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
  const rankLine = (metric: keyof typeof ranks) =>
    `${t("rankState", { rank: ranks[metric].state, total: ranks[metric].stateTotal, state: localState })} · ${t("rankIndia", {
      rank: ranks[metric].india,
      total: ranks[metric].indiaTotal,
    })}`;

  const cards = [
    { metric: "population" as const, title: tMetrics("population.short"), value: formatPopulation(district.population), source: DISTRICT_SOURCES.population },
    { metric: "density" as const, title: tMetrics("density.short"), value: formatDensity(district.density) },
    { metric: "literacyRate" as const, title: tMetrics("literacyRate.long"), value: `${district.literacyRate}%`, source: DISTRICT_SOURCES.literacyRate },
    { metric: "sexRatio" as const, title: tMetrics("sexRatio.short"), value: String(district.sexRatio), source: DISTRICT_SOURCES.sexRatio },
    { metric: "area" as const, title: tMetrics("area.short"), value: formatArea(district.area) },
  ].filter((card) => district[card.metric] > 0);

  const comparison = [
    {
      label: tMetrics("literacyRate.long"),
      values: [`${district.literacyRate}%`, `${stateAverages.literacyRate.toFixed(1)}%`, `${indiaAverages.literacyRate.toFixed(1)}%`],
    },
    {
      label: tMetrics("sexRatio.short"),
      values: [String(district.sexRatio), String(Math.round(stateAverages.sexRatio)), String(Math.round(indiaAverages.sexRatio))],
    },
    {
      label: tMetrics("density.short"),
      values: [formatDensity(district.density), formatDensity(stateAverages.density), formatDensity(indiaAverages.density)],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        breadcrumbs={[
          { label: localState, href: `/state/${state.id}` },
          { label: name, href: districtPath(state.id, district.name) },
        ]}
      />

      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-4 sm:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted sm:mb-3">
            <Link href={`/state/${state.id}`} className="transition-colors hover:text-text-primary">
              {t("eyebrow", { state: localState })}
            </Link>
          </p>
          <h1 className="text-display mb-2 text-text-primary sm:mb-3">{name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-base text-text-tertiary sm:text-lg">
            {district.headquarters && <span>{tDistricts("headquarters", { name: local(district.headquarters) })}</span>}
            <PlaceBadges isCapital={district.isCapital} isMetro={district.isMetro} tier={district.tier} />
          </div>
        </motion.section>

        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="order-2 flex flex-col gap-3 lg:order-none">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {cards.map((card, i) => (
                <MetricCard
                  key={card.metric}
                  title={card.title}
                  value={card.value}
                  subtitle={rankLine(card.metric)}
                  source={card.source}
                  delay={0.04 * i}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <LinkButton href={`/compare?a=${encodeURIComponent(`${state.id}/district/${district.name}`)}`} size="sm">
                <Icon name="plus" size={14} />
                {tCommon("compare")}
              </LinkButton>
              <SourcesInfo place={`${district.name}, ${state.name}`}>{tDistricts("infoSources")}</SourcesInfo>
            </div>
          </div>

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

        <motion.section {...reveal(reduceMotion, 0.12)} className="mb-12">
          <SectionHeader title={t("compareTitle")} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-border-light text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="py-3 pr-4 font-medium" />
                  <th className="py-3 pr-4 font-medium">{name}</th>
                  <th className="py-3 pr-4 font-medium">{localState}</th>
                  <th className="py-3 font-medium">{tCommon("india")}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-border-light/60">
                    <th className="py-3 pr-4 text-sm font-medium text-text-secondary">{row.label}</th>
                    {row.values.map((value, i) => (
                      <td key={i} className={i === 0 ? "py-3 pr-4 font-mono text-lg text-text-primary" : "py-3 pr-4 font-mono text-text-tertiary"}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section {...reveal(reduceMotion, 0.14)} className="mb-12">
          <SectionHeader
            title={tOdop("title")}
            description={tOdop("intro", { name })}
            actions={<SourcesInfo>DPIIT · ODOP v33, 31 Dec 2025 ·</SourcesInfo>}
          />
          {odop.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {odop.map((item) => (
                <li key={item.product} className="rounded-xl border border-border-light bg-bg-secondary/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{tOdop(`categories.${item.category}`)}</p>
                  <p className="mt-1.5 font-semibold text-text-primary">{item.product}</p>
                  <Badge className="mt-3">{tOdop(`sectors.${item.sector}`)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">{tOdop("none")}</p>
          )}
        </motion.section>

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
