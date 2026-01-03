"use client";

import { motion } from "framer-motion";
import type { State, MetricKey } from "@/types";

const metrics: { key: MetricKey; label: string }[] = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "literacyRate", label: "Literacy" },
  { key: "hdi", label: "HDI" },
  { key: "density", label: "Density" },
];

interface MetricSelectorProps {
  selected: MetricKey;
  onSelect: (metric: MetricKey) => void;
}

export function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {metrics.map((m) => (
        <motion.button
          key={m.key}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(m.key)}
          className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selected === m.key ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
        >
          {selected === m.key && (
            <motion.div
              layoutId="metric-bg"
              className="absolute inset-0 rounded-lg bg-bg-card border border-border-light shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{m.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
