"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDistricts } from "@/hooks/useDistricts";
import { useFormat } from "@/hooks/useFormat";
import type { City, District } from "@/types";

type FilterType = "all" | "cities";
type SortType = "population" | "name" | "literacy" | "density";

interface DistrictListProps {
  stateCode: string;
  stateName: string;
  cities?: City[];
  selectedDistrict?: string | null;
  onDistrictSelect?: (districtName: string) => void;
}

// Central definition of what counts as a "major city" (district-level) for this view.
// Keep this strict so only truly significant, urban, livable economic centers show up automatically.
// Criteria (any state):
// - Known metro: explicit metro flag on city/district OR tier 1
// - OR very large & urban & relatively high literacy:
//   - population >= 30 lakh
//   - density >= 1,200 / km²
//   - literacy >= 75%
function isMajorArea(d: District, city?: City) {
  const pop = city?.population ?? d.population;
  const tier = city?.tier ?? d.tier;
  const isMetro = !!(city?.isMetro || d.isMetro);
  const density =
    d.density ||
    (city && city.area > 0 ? Math.round(city.population / city.area) : 0);
  const literacy = d.literacyRate || 0;

  // Always include explicit metros / tier-1 cities
  if (isMetro || tier === 1) return true;

  const bigUrban = pop >= 3_000_000 && density >= 1200;
  const goodQuality = literacy >= 75;

  return bigUrban && goodQuality;
}

export function DistrictList({ stateCode, stateName, cities = [], selectedDistrict, onDistrictSelect }: DistrictListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("population");
  const { data: districts, isLoading, error } = useDistricts(stateCode);

  const items = useMemo(() => {
    const districtList = districts || [];

    const cityNames = new Set(cities.map((c) => c.name.toLowerCase()));

    const markedDistricts = districtList.map((d) => {
      const matchedCity = cities.find(
        (c) =>
          c.name.toLowerCase() === d.name.toLowerCase() ||
          c.name.toLowerCase() === d.headquarters?.toLowerCase()
      );

      const isMajor = isMajorArea(d, matchedCity);

      return {
        ...d,
        hasCity: isMajor,
        cityData: matchedCity,
        isCity: false,
        isMajor,
      };
    });

    // We now work purely at district level: no standalone city rows, to avoid confusion/duplicates.
    return markedDistricts;
  }, [districts, cities]);

  const filteredAndSorted = useMemo(() => {
    const result = filter === "cities" ? items.filter((item) => item.isMajor) : items;

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "literacy":
          return b.literacyRate - a.literacyRate;
        case "density":
          return b.density - a.density;
        case "population":
        default:
          return b.population - a.population;
      }
    });
  }, [items, filter, sortBy]);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-bg-secondary animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border-light bg-bg-secondary/40 p-4"
            >
              <div className="mb-3 h-4 w-40 rounded bg-bg-tertiary animate-pulse" />
              <div className="mb-1 h-3 w-24 rounded bg-bg-tertiary animate-pulse" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="h-2 w-16 rounded bg-bg-tertiary animate-pulse" />
                  <div className="h-4 w-20 rounded bg-bg-tertiary animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-12 rounded bg-bg-tertiary animate-pulse" />
                  <div className="h-4 w-16 rounded bg-bg-tertiary animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex flex-col gap-2">
          <p className="font-medium text-text-primary">Error loading district data</p>
          <p className="text-sm text-text-muted">
            {error instanceof Error ? error.message : "Failed to fetch data from API"}
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            Please check your API configuration or enable local data fallback in settings.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-text-muted">Data for {stateName} coming soon.</p>
      </div>
    );
  }

  const cityCount = items.filter((i) => i.hasCity).length;

  return (
    <div className="card p-6">
      {/* Filters & Sort */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === "all"
              ? "bg-accent-primary text-white"
              : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("cities")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === "cities"
              ? "bg-accent-primary text-white"
              : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
          >
            Major Cities ({cityCount})
          </button>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Sort:</span>
          {(["population", "name", "literacy", "density"] as SortType[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sortBy === s
                ? "bg-text-primary text-bg-primary"
                : "bg-bg-secondary text-text-muted hover:text-text-secondary"
                }`}
            >
              {s === "population" ? "Pop" : s === "literacy" ? "Lit%" : s === "density" ? "Den" : "A-Z"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {filteredAndSorted.map((item, i) => (
          <DistrictItem
            key={item.id}
            item={item}
            delay={i * 0.015}
            isSelected={selectedDistrict?.toLowerCase() === item.name.toLowerCase()}
            onSelect={() => onDistrictSelect?.(item.name)}
          />
        ))}
      </div>
    </div>
  );
}

interface ItemWithCity extends District {
  hasCity?: boolean;
  cityData?: City;
  isCity?: boolean;
  isMajor?: boolean;
}

function DistrictItem({ item, delay, isSelected, onSelect }: { item: ItemWithCity; delay: number; isSelected?: boolean; onSelect?: () => void }) {
  const city = item.cityData;
  const { formatPopulation, formatDensity } = useFormat();

  const isCapital = city?.isCapital || item.isCapital;
  const isMetro =
    city?.isMetro ||
    item.isMetro ||
    city?.tier === 1 ||
    item.tier === 1;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
      const mapElement = document.getElementById("state-map");
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(delay, 0.3) }}
      onClick={handleClick}
      className={`rounded-xl border p-5 transition-all hover:shadow-md hover:bg-bg-secondary cursor-pointer ${isSelected
          ? "border-accent-primary bg-accent-muted/30 shadow-md ring-2 ring-accent-primary/20"
          : item.hasCity
            ? "border-accent-primary/20 bg-bg-secondary/60"
            : "border-border-light bg-bg-secondary/40"
        }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-bold text-text-primary">{item.name}</h4>
            {isCapital && (
              <span className="rounded bg-accent-primary px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                Capital
              </span>
            )}
            {isMetro && (
              <span className="rounded bg-accent-secondary px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                Metro
              </span>
            )}
          </div>
          {item.headquarters && !item.isCity && (
            <span className="text-sm font-medium text-text-tertiary">HQ: {item.headquarters}</span>
          )}
        </div>

        {(city?.tier || item.tier) && (
          <span className="rounded-lg bg-bg-tertiary border border-border-light px-2.5 py-1 text-xs font-semibold text-text-secondary">
            Tier {city?.tier || item.tier}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <span className="block text-xs font-medium text-text-secondary uppercase tracking-wide">Population</span>
          <span className="text-lg font-semibold text-text-primary mt-0.5">
            {formatPopulation(item.population)}
          </span>
        </div>
        {!item.isCity && item.literacyRate > 0 && (
          <div>
            <span className="block text-xs font-medium text-text-secondary uppercase tracking-wide">Literacy</span>
            <span className="text-lg font-semibold text-text-primary mt-0.5">{item.literacyRate}%</span>
          </div>
        )}
        <div>
          <span className="block text-xs font-medium text-text-secondary uppercase tracking-wide">Density</span>
          <span className="text-lg font-semibold text-text-primary mt-0.5">{formatDensity(item.density)}</span>
        </div>
        {!item.isCity && item.sexRatio > 0 && (
          <div>
            <span className="block text-xs font-medium text-text-secondary uppercase tracking-wide">Sex Ratio</span>
            <span className="text-lg font-semibold text-text-primary mt-0.5">{item.sexRatio}</span>
          </div>
        )}
        {item.isCity && city && (
          <div>
            <span className="block text-xs font-medium text-text-secondary uppercase tracking-wide">Area</span>
            <span className="text-lg font-semibold text-text-primary mt-0.5">{city.area} km²</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
