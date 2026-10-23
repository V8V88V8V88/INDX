"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, CardTitle } from "./ui";

export interface ComparisonRow {
  label: string;
  values: [ReactNode, ReactNode];
  winner?: 0 | 1 | null;
}

interface ComparisonTableProps {
  title: string;
  columns: [string, string];
  rows: ComparisonRow[];
  delay?: number;
  trigger?: boolean;
}

export function ComparisonTable({ title, columns, rows, delay = 0, trigger = true }: ComparisonTableProps) {
  return (
    <Card delay={delay} trigger={trigger}>
      <CardTitle className="mb-6">{title}</CardTitle>
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-border-light text-xs font-semibold">
            <th scope="col" className="pb-4 text-text-muted">Metric</th>
            {columns.map((column) => (
              <th key={column} scope="col" className="truncate pb-4 text-center text-accent-primary">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border-light/50 last:border-0">
              <th scope="row" className="py-3.5 pr-2 text-sm font-medium text-text-secondary">
                {row.label}
              </th>
              {row.values.map((value, i) => (
                <td
                  key={i}
                  className={cn(
                    "py-3.5 text-center font-mono text-base",
                    row.winner === i ? "font-bold text-accent-primary" : "text-text-primary",
                  )}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
