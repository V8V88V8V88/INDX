"use client";

import { Card, CardTitle } from "./ui";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  source?: string;
  delay?: number;
  trigger?: boolean;
}

export function MetricCard({ title, value, unit, subtitle, source, delay = 0, trigger = true }: MetricCardProps) {
  return (
    <Card delay={delay} trigger={trigger} className="flex flex-col gap-1.5 p-3.5 sm:gap-3 sm:p-5">
      <CardTitle className="line-clamp-2 min-h-[2lh] sm:min-h-0">{title}</CardTitle>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tracking-tight text-text-primary sm:text-3xl lg:text-2xl 2xl:text-3xl">{value}</span>
        {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
      </div>
      {(subtitle || source) && (
        <p className="mt-auto text-xs text-text-muted sm:text-sm">
          {[subtitle, source].filter(Boolean).join(" · ")}
        </p>
      )}
    </Card>
  );
}
