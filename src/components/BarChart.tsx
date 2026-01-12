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
  trigger?: boolean;
}

export function BarChart({ title, items, delay = 0, trigger = true }: BarChartProps) {
  const max = Math.max(...items.map((i) => i.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={trigger ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
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
                animate={trigger ? { width: `${(item.value / max) * 100}%` } : { width: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.2 + i * 0.1 }}
                className={`h-full rounded-full ${item.highlight ? "bg-accent-primary" : "bg-accent-primary/50"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
