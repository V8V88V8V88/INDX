"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, CardTitle, Icon } from "./ui";

export interface ComparisonRow {
  label: string;
  values: [ReactNode, ReactNode];
  winner?: 0 | 1 | null;
}

interface ComparisonTableProps {
  title?: string;
  columns: [string, string];
  rows: ComparisonRow[];
  delay?: number;
  trigger?: boolean;
}

export function ComparisonTable({ title, columns, rows, delay = 0, trigger = true }: ComparisonTableProps) {
  return (
    <Card plain delay={delay} trigger={trigger}>
      {title && <CardTitle className="mb-6">{title}</CardTitle>}
      <dl className="grid grid-cols-2 gap-y-6 border-y border-border-light py-6 lg:grid-cols-4 lg:gap-y-0">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn("min-w-0 px-4 sm:px-6", "border-border-light", i % 2 === 0 ? "pl-0 sm:pl-0" : "border-l", i === 2 && "lg:border-l lg:pl-6")}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{row.label}</dt>
            <dd className="mt-2 flex items-center gap-1.5 truncate font-mono text-lg text-text-primary sm:text-xl">
              {row.values[0]}
              {row.winner != null && (
                <Icon
                  name={row.winner === 0 ? "arrow-up" : "arrow-down"}
                  size={14}
                  className={cn("shrink-0", row.winner === 0 ? "text-accent-primary" : "text-text-muted")}
                />
              )}
            </dd>
            <dd className="mt-1 truncate text-xs text-text-muted">
              {columns[1]} {row.values[1]}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
