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
    <Card delay={delay} trigger={trigger} className="space-y-3 p-5">
      <CardTitle>{title}</CardTitle>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-text-primary">{value}</span>
        {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
      </div>
      {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
    </Card>
  );
}
