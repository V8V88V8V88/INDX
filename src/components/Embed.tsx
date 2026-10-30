"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDistricts } from "@/hooks/useDistricts";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { DISTRICT_SOURCES, METRIC_SOURCES } from "@/lib/metrics";
import { districtFillFor, type DistrictMetric } from "@/lib/districts";
import { getMetricPaletteIndices, type MapMetric } from "@/lib/map-view";
import { Link } from "@/i18n/navigation";
import { IndiaMap } from "./IndiaMap";
import { StateMap } from "./StateMap";
import { Icon } from "./ui";

function EmbedShell({ title, metric, source, href, children }: { title: string; metric: MapMetric; source?: string; href: string; children: ReactNode }) {
  const t = useTranslations("Embed");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary p-3">
      <h1 className="mb-2 text-sm font-semibold text-text-primary">{title}</h1>
      <div className="min-h-0 flex-1">{children}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span>{tCommon("low")}</span>
          <div className="flex overflow-hidden rounded-full">
            {getMetricPaletteIndices(metric).map((i) => (
              <div key={i} className="h-2.5 w-6" style={{ backgroundColor: `var(--choro-${i})` }} />
            ))}
          </div>
          <span>{tCommon("high")}</span>
          <span className="ml-2 text-text-tertiary">{tMetrics(`${metric}.long`)}</span>
          {source && <span>{source}</span>}
        </div>
        <Link href={href} target="_blank" className="inline-flex items-center gap-1 font-medium text-text-secondary hover:text-text-primary">
          {t("open")}
          <Icon name="external" size={12} />
        </Link>
      </div>
    </div>
  );
}

export function EmbedIndiaMap({ metric }: { metric: MapMetric }) {
  const t = useTranslations("Embed");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");

  return (
    <EmbedShell
      title={t("frameTitle", { place: tCommon("india"), metric: tMetrics(`${metric}.long`) })}
      metric={metric}
      source={METRIC_SOURCES[metric]}
      href="/"
    >
      <IndiaMap colorByMetric={metric} interactive={false} embedded />
    </EmbedShell>
  );
}

export function EmbedStateMap({ stateId, metric }: { stateId: string; metric: DistrictMetric }) {
  const t = useTranslations("Embed");
  const tMetrics = useTranslations("Metrics");
  const { stateName, placeName } = usePlaceNames();
  const { data: districts } = useDistricts(stateId);

  return (
    <EmbedShell
      title={t("frameTitle", { place: stateName(stateId), metric: tMetrics(`${metric}.long`) })}
      metric={metric}
      source={metric in DISTRICT_SOURCES ? DISTRICT_SOURCES[metric as keyof typeof DISTRICT_SOURCES] : undefined}
      href={`/state/${stateId}`}
    >
      <StateMap
        stateCode={stateId}
        districtFill={districts?.length ? districtFillFor(districts, metric) : undefined}
        labelFor={(name) => placeName(stateId, name)}
      />
    </EmbedShell>
  );
}
