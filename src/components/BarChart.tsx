"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Card, CardTitle } from "./ui";

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
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card delay={delay} trigger={trigger}>
      <CardTitle className="mb-5">{title}</CardTitle>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className={cn("truncate text-sm font-medium", item.highlight ? "text-accent-primary" : "text-text-secondary")}>
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-sm text-text-muted">{item.displayValue}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
              <motion.div
                initial={{ width: 0 }}
                animate={trigger ? { width: `${(item.value / max) * 100}%` } : { width: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.2 + i * 0.1 }}
                className={cn("h-full rounded-full", item.highlight ? "bg-accent-primary" : "bg-accent-primary/50")}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
