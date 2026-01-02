"use client";

import { motion } from "framer-motion";
import { useDistricts } from "@/hooks/useDistricts";
import { formatPopulation } from "@/data/india";
import type { City } from "@/types";

interface DistrictListProps {
  stateCode: string;
  stateName: string;
  cities?: City[];
}

export function DistrictList({ stateCode, stateName, cities = [] }: DistrictListProps) {
  const { data: districts, isLoading, error } = useDistricts(stateCode);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <span className="text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  const sortedDistricts = districts ? [...districts].sort((a, b) => b.population - a.population) : [];
  const sortedCities = [...cities].sort((a, b) => b.population - a.population);

  // If no districts, show cities
  if (error || !districts || districts.length === 0) {
    if (cities.length === 0) {
      return (
        <div className="card p-6">
          <p className="text-text-muted">Data for {stateName} coming soon.</p>
        </div>
      );
    }

    return (
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Major Cities
          </h3>
          <span className="text-xs text-text-muted">{cities.length} cities</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCities.map((city, i) => (
            <CityItem key={city.id} city={city} delay={i * 0.02} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Districts */}
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
                  <span className="text-text-muted">Pop: </span>
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

      {/* Cities */}
      {cities.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
              Major Cities
            </h3>
            <div className="flex gap-2">
              {cities.filter((c) => c.tier === 1).length > 0 && (
                <span className="rounded-md bg-accent-primary px-2 py-1 text-xs font-medium text-white">
                  {cities.filter((c) => c.tier === 1).length} Tier 1
                </span>
              )}
              {cities.filter((c) => c.tier === 2).length > 0 && (
                <span className="rounded-md bg-accent-muted px-2 py-1 text-xs font-medium text-accent-primary">
                  {cities.filter((c) => c.tier === 2).length} Tier 2
                </span>
              )}
              {cities.filter((c) => c.tier === 3).length > 0 && (
                <span className="rounded-md bg-bg-tertiary px-2 py-1 text-xs font-medium text-text-muted">
                  {cities.filter((c) => c.tier === 3).length} Tier 3
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCities.map((city, i) => (
              <CityItem key={city.id} city={city} delay={i * 0.02} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CityItem({ city, delay }: { city: City; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(delay, 0.4) }}
      className="rounded-lg border border-border-light bg-bg-secondary/50 p-3 transition-colors hover:bg-bg-secondary"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-text-primary">{city.name}</h4>
          {city.isCapital && (
            <span className="rounded bg-accent-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-primary">
              Capital
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">Tier {city.tier}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Pop: </span>
          <span className="font-mono text-text-secondary">{formatPopulation(city.population)}</span>
        </div>
        <div>
          <span className="text-text-muted">Area: </span>
          <span className="font-mono text-text-secondary">{city.area} km²</span>
        </div>
      </div>
    </motion.div>
  );
}
