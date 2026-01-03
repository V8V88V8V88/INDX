"use client";

import { motion } from "framer-motion";
import type { City } from "@/types";
import { formatPopulation } from "@/data/india";

interface CityCardProps {
  city: City;
  stateName: string;
  delay?: number;
}

const tierStyles: Record<1 | 1.5 | 2 | 2.5 | 3, string> = {
  1: "bg-accent-primary text-white",
  1.5: "bg-accent-primary/80 text-white",
  2: "bg-accent-musted text-accent-primary",
  2.5: "bg-accent-muted/80 text-accent-primary",
  3: "bg-bg-tertiary text-text-muted",
};

export function CityCard({ city, stateName, delay = 0 }: CityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
      className="card card-interactive p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${tierStyles[city.tier]}`}>
            Tier {city.tier}
          </span>
          {city.isCapital && (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Capital
            </span>
          )}
          {city.isMetro && !city.isCapital && (
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
              Metro
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-text-muted">{city.id}</span>
      </div>

      <h3 className="mb-1 text-lg font-semibold text-text-primary">{city.name}</h3>
      <p className="mb-4 text-sm text-text-tertiary">{stateName}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-text-muted">Population</p>
          <p className="font-medium text-text-secondary">{formatPopulation(city.population)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Area</p>
          <p className="font-medium text-text-secondary">{city.area} km²</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Density</p>
          <p className="font-medium text-text-secondary">
            {Math.round(city.population / city.area).toLocaleString()}/km²
          </p>
        </div>
      </div>
    </motion.div>
  );
}
