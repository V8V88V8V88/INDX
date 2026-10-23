"use client";

import { Card, CardTitle } from "./ui";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  delay?: number;
  trigger?: boolean;
}

export function MetricCard({ title, value, unit, subtitle, delay = 0, trigger = true }: MetricCardProps) {
  return (
    <Card delay={delay} trigger={trigger} className="space-y-2 p-4 sm:space-y-3 sm:p-5">
      <CardTitle>{title}</CardTitle>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-2xl 2xl:text-3xl text-text-primary">{value}</span>
        {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-text-muted sm:text-sm">{subtitle}</p>}
    </Card>
  );
}
