"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface RankedItem {
  rank: number;
  name: string;
  value: string;
  href?: string;
  barWidth: number;
}

interface RankedListProps {
  title: string;
  items: RankedItem[];
  delay?: number;
}

export function RankedList({ title, items, delay = 0 }: RankedListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5"
    >
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const inner = (
            <div className="group relative">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-medium text-text-muted">{item.rank}</span>
                  <span className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="text-mono text-text-secondary">{item.value}</span>
              </div>
              <div className="absolute bottom-0 left-9 right-0 h-0.5 overflow-hidden rounded-full bg-bg-tertiary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.barWidth}%` }}
                  transition={{ duration: 0.6, delay: delay + i * 0.05 }}
                  className="h-full rounded-full bg-accent-primary/40"
                />
              </div>
            </div>
          );

          return item.href ? (
            <Link key={item.name} href={item.href} className="block">{inner}</Link>
          ) : (
            <div key={item.name}>{inner}</div>
          );
        })}
      </div>
    </motion.div>
  );
}
