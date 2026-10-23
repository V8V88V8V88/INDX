"use client";

import { METRICS } from "@/lib/metrics";
import type { MetricKey } from "@/types";
import { SegmentedControl } from "./ui";

const options = METRICS.map((m) => ({ value: m.key, label: m.label }));

interface MetricSelectorProps {
  selected: MetricKey;
  onSelect: (metric: MetricKey) => void;
}

export function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  return <SegmentedControl label="Metric" options={options} value={selected} onChange={onSelect} />;
}
