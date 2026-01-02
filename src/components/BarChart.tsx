"use client";

import { motion } from "framer-motion";

interface BarChartItem {
  name: string;
  value: number;
  displayValue: string;
  highlight?: boolean;
}

interface BarChartProps {
  title: string;
  items: BarChartItem[];
  delay?: number;
}

export function BarChart({ title, items, delay = 0 }: BarChartProps) {
  const max = Math.max(...items.map((i) => i.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5"
    >
      <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${item.highlight ? "text-accent-primary" : "text-text-secondary"}`}>
                {item.name}
              </span>
              <span className="font-mono text-sm text-text-muted">{item.displayValue}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / max) * 100}%` }}
                transition={{ duration: 0.6, delay: delay + i * 0.05 }}
                className={`h-full rounded-full ${item.highlight ? "bg-accent-primary" : "bg-accent-primary/50"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
