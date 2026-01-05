"use client";

import type { MetricKey } from "@/types";

const metrics: { key: MetricKey; label: string }[] = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "literacyRate", label: "Literacy" },
  { key: "hdi", label: "HDI" },
  { key: "density", label: "Density" },
  { key: "sexRatio", label: "Sex Ratio" },
  { key: "area", label: "Area" },
];

interface MetricSelectorProps {
  selected: MetricKey;
  onSelect: (metric: MetricKey) => void;
}

export function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-bg-secondary p-1.5">
      {metrics.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${selected === m.key
            ? "bg-bg-card text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-secondary"
            }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
