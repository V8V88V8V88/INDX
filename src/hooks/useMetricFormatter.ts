"use client";

import { useCallback } from "react";
import { useFormat } from "@/hooks/useFormat";
import type { MetricKey } from "@/types";

export function useMetricFormatter() {
  const { formatPopulation, formatCurrency, formatDensity, formatArea } = useFormat();

  return useCallback(
    (key: MetricKey, value: number): string => {
      switch (key) {
        case "population":
          return formatPopulation(value);
        case "gdp":
          return formatCurrency(value * 10000000);
        case "literacyRate":
          return `${value.toFixed(1)}%`;
        case "hdi":
          return value.toFixed(3);
        case "density":
          return formatDensity(value);
        case "sexRatio":
          return Math.round(value).toString();
        case "area":
          return formatArea(value);
      }
    },
    [formatPopulation, formatCurrency, formatDensity, formatArea],
  );
}
