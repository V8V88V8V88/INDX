"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" | "stable" };
  icon?: ReactNode;
  delay?: number;
  className?: string;
  trigger?: boolean;
}

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  icon,
  delay = 0,
  className = "",
  trigger = true,
}: MetricCardProps) {
  const trendColor = trend?.direction === "up" ? "text-emerald-600" : trend?.direction === "down" ? "text-rose-500" : "text-text-muted";
  const trendIcon = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={trigger ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={`card p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-caption font-medium uppercase tracking-wider text-text-muted">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-text-primary">{value}</span>
            {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
          </div>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span className={`text-sm font-medium ${trendColor}`}>
                  {trendIcon} {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && <span className="text-sm text-text-muted">{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-tertiary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
