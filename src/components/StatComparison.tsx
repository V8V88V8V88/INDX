"use client";

import { motion } from "framer-motion";

interface ComparisonItem {
  label: string;
  stateValue: string | number;
  nationalValue: string | number;
  unit?: string;
  higher?: "state" | "national" | null;
}

interface StatComparisonProps {
  title: string;
  stateName: string;
  items: ComparisonItem[];
  delay?: number;
}

export function StatComparison({ title, stateName, items, delay = 0 }: StatComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5"
    >
      <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-muted">{title}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 border-b border-border-light pb-3">
          <div className="text-xs font-medium text-text-muted">Metric</div>
          <div className="text-center text-xs font-medium text-accent-primary">{stateName}</div>
          <div className="text-center text-xs font-medium text-text-muted">National Avg</div>
        </div>

        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-3 gap-4 items-center">
            <div className="text-sm text-text-secondary">{item.label}</div>
            <div className={`text-center font-mono text-sm ${item.higher === "state" ? "font-semibold text-accent-primary" : "text-text-secondary"}`}>
              {item.stateValue}{item.unit}
            </div>
            <div className={`text-center font-mono text-sm ${item.higher === "national" ? "font-semibold text-text-primary" : "text-text-muted"}`}>
              {item.nationalValue}{item.unit}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
