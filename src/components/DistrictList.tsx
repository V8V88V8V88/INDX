"use client";

import { motion } from "framer-motion";
import { useDistricts } from "@/hooks/useDistricts";
import { formatPopulation } from "@/data/india";

interface DistrictListProps {
  stateCode: string;
  stateName: string;
}

export function DistrictList({ stateCode, stateName }: DistrictListProps) {
  const { data: districts, isLoading, error } = useDistricts(stateCode);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <span className="text-text-muted">Loading districts...</span>
        </div>
      </div>
    );
  }

  if (error || !districts || districts.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-text-muted">
          District data for {stateName} coming soon.
        </p>
      </div>
    );
  }

  const sortedDistricts = [...districts].sort((a, b) => b.population - a.population);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
          Districts
        </h3>
        <span className="text-xs text-text-muted">{districts.length} districts</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedDistricts.map((district, i) => (
          <motion.div
            key={district.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
            className="rounded-lg border border-border-light bg-bg-secondary/50 p-3 transition-colors hover:bg-bg-secondary"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium text-text-primary">{district.name}</h4>
              {district.headquarters && (
                <span className="text-xs text-text-muted">HQ: {district.headquarters}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">Population: </span>
                <span className="font-mono text-text-secondary">
                  {formatPopulation(district.population)}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Literacy: </span>
                <span className="font-mono text-text-secondary">{district.literacyRate}%</span>
              </div>
              <div>
                <span className="text-text-muted">Density: </span>
                <span className="font-mono text-text-secondary">{district.density}/km²</span>
              </div>
              <div>
                <span className="text-text-muted">Sex Ratio: </span>
                <span className="font-mono text-text-secondary">{district.sexRatio}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

