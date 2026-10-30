"use client";

import { useTranslations } from "next-intl";
import { METRICS } from "@/lib/metrics";
import type { MetricKey } from "@/types";
import { SegmentedControl } from "./ui";

interface MetricSelectorProps {
  selected: MetricKey;
  onSelect: (metric: MetricKey) => void;
}

export function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  const t = useTranslations("Metrics");
  const options = METRICS.map((key) => ({ value: key, label: t(`${key}.short`) }));
  return <SegmentedControl label={t("label")} options={options} value={selected} onChange={onSelect} scrollable />;
}
