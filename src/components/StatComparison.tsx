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
  trigger?: boolean;
}

export function StatComparison({ title, stateName, items, delay = 0, trigger = true }: StatComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={trigger ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className="card p-6"
    >
      <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4 border-b border-border-light pb-4">
          <div className="text-xs font-semibold text-text-muted">Metric</div>
          <div className="text-center text-xs font-semibold text-accent-primary">{stateName}</div>
          <div className="text-center text-xs font-semibold text-text-muted">National Avg</div>
        </div>

        {items.map((item, index) => (
          <div
            key={item.label}
            className={`grid grid-cols-3 gap-4 items-center py-2 ${index !== items.length - 1 ? 'border-b border-border-light/50' : ''}`}
          >
            <div className="text-sm font-medium text-text-secondary">{item.label}</div>
            <div className={`text-center font-mono text-base ${item.higher === "state" ? "font-bold text-accent-primary" : "text-text-primary"}`}>
              {item.stateValue}{item.unit}
            </div>
            <div className={`text-center font-mono text-base ${item.higher === "national" ? "font-bold text-text-primary" : "text-text-secondary"}`}>
              {item.nationalValue}{item.unit}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
