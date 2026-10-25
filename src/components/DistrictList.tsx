"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDistricts } from "@/hooks/useDistricts";
import { useFormat } from "@/hooks/useFormat";
import { cn } from "@/lib/cn";
import type { City, District } from "@/types";
import { PlaceBadges } from "./PlaceBadges";
import { Button, Icon, SegmentedControl, Stat } from "./ui";

type FilterType = "all" | "cities" | "1" | "2" | "3" | "4";
type SortType = "population" | "area" | "density" | "literacy" | "sexRatio" | "name";

const sortOptions = [
  { value: "population", label: "Population", title: "Sort by population" },
  { value: "area", label: "Area", title: "Sort by area" },
  { value: "density", label: "Density", title: "Sort by density" },
  { value: "literacy", label: "Literacy", title: "Sort by literacy" },
  { value: "sexRatio", label: "Sex Ratio", title: "Sort by sex ratio" },
  { value: "name", label: "A–Z", title: "Sort alphabetically" },
] as const;

const sortValue: Record<Exclude<SortType, "name">, (d: District) => number> = {
  population: (d) => d.population,
  area: (d) => d.area,
  density: (d) => d.density,
  literacy: (d) => d.literacyRate,
  sexRatio: (d) => d.sexRatio,
};

interface DistrictListProps {
  stateCode: string;
  stateName: string;
  cities?: City[];
  selectedDistrict?: string | null;
  onDistrictSelect?: (districtName: string) => void;
}

// Priority levels for determining "major" status
// Higher priority = more important / always included
const PRIORITY_METRO = 4;      // Explicit metro flag
const PRIORITY_TIER1 = 3;      // Tier 1 cities
const PRIORITY_TIER2 = 2;      // Tier 2 cities  
const PRIORITY_SIGNIFICANT = 1; // Population/density based
const PRIORITY_NONE = 0;       // Not a major area

// Maximum number of "major cities" to show per state
// This keeps the view focused on truly significant areas
const MAX_MAJOR_CITIES = 8;

// Calculate the priority level for a district/city
// Higher priority = more likely to be shown as "major"
function getMajorPriority(d: District, city?: City): number {
  const pop = city?.population ?? d.population;
  const tier = city?.tier ?? d.tier;
  const isMetro = !!(city?.isMetro || d.isMetro);
  const density =
    d.density ||
    (city && city.area > 0 ? Math.round(city.population / city.area) : 0);
  const literacy = d.literacyRate || 0;

  // Priority based on tier/metro status
  if (isMetro) return PRIORITY_METRO;
  if (tier === 1) return PRIORITY_TIER1;
  if (tier === 2) return PRIORITY_TIER2;

  // For districts without tier classification, check if significant urban center
  // Relaxed criteria for state-level relevance
  const significantUrban = pop >= 1_500_000 && density >= 600 && literacy >= 70;
  if (significantUrban) return PRIORITY_SIGNIFICANT;

  return PRIORITY_NONE;
}

// Calculate a "significance score" for ranking districts
// Used to pick the top N when too many qualify
function getSignificanceScore(d: District, city?: City): number {
  const pop = city?.population ?? d.population;
  const tier = city?.tier ?? d.tier;
  const isMetro = !!(city?.isMetro || d.isMetro);
  const density = d.density || 0;
  const literacy = d.literacyRate || 0;

  // Base score from tier/metro (heavily weighted)
  let score = 0;
  if (isMetro) score += 10000;
  if (tier === 1) score += 5000;
  else if (tier === 2) score += 2000;
  else if (tier === 3) score += 500;

  // Add population factor (normalized, max ~2000 for 20M+ pop)
  score += Math.min(pop / 10000, 2000);

  // Add density factor (normalized, max 500)
  score += Math.min(density / 2, 500);

  // Add literacy factor (max 100)
  score += literacy;

  return score;
}

export function DistrictList({ stateCode, stateName, cities = [], selectedDistrict, onDistrictSelect }: DistrictListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("population");
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: districts, isLoading, error } = useDistricts(stateCode);

  const items = useMemo(() => {
    const districtList = districts || [];

    // First pass: calculate priority and score for each district
    const scoredDistricts = districtList.map((d) => {
      const matchedCity = cities.find(
        (c) =>
          c.name.toLowerCase() === d.name.toLowerCase() ||
          c.name.toLowerCase() === d.headquarters?.toLowerCase()
      );

      const priority = getMajorPriority(d, matchedCity);
      const score = getSignificanceScore(d, matchedCity);

      return {
        ...d,
        cityData: matchedCity,
        _priority: priority,
        _score: score,
      };
    });

    // Count total qualifying districts to determine if we need to cap
    const allMajorCount = scoredDistricts.filter(d => d._priority > PRIORITY_NONE).length;

    // Determine the cutoff: we want at most MAX_MAJOR_CITIES
    // Strategy:
    // - If we have <= MAX_MAJOR_CITIES qualifying, show all
    // - If we have more, pick the top ones by score
    let majorCutoffScore = 0;
    if (allMajorCount > MAX_MAJOR_CITIES) {
      // Sort by score descending and find the cutoff
      const qualifyingDistricts = scoredDistricts
        .filter(d => d._priority > PRIORITY_NONE)
        .sort((a, b) => b._score - a._score);

      // The cutoff score is the score of the Nth item (0-indexed: N-1)
      majorCutoffScore = qualifyingDistricts[MAX_MAJOR_CITIES - 1]?._score || 0;
    }

    // Second pass: mark as major based on adaptive criteria
    const markedDistricts = scoredDistricts.map((d) => {
      let isMajor = false;

      if (allMajorCount <= MAX_MAJOR_CITIES) {
        // Few qualifying districts: include all that have any priority
        isMajor = d._priority > PRIORITY_NONE;
      } else {
        // Many qualifying districts: only include top scorers
        isMajor = d._priority > PRIORITY_NONE && d._score >= majorCutoffScore;
      }

      return {
        ...d,
        hasCity: isMajor,
        isMajor,
      };
    });

    return markedDistricts;
  }, [districts, cities]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = items.filter(
      (item) =>
        (filter === "all" || (filter === "cities" ? item.isMajor : String(item.tier) === filter)) &&
        (!q || item.name.toLowerCase().includes(q) || item.headquarters?.toLowerCase().includes(q)),
    );

    const direction = ascending ? 1 : -1;
    return [...result].sort((a, b) =>
      sortBy === "name"
        ? -direction * a.name.localeCompare(b.name)
        : direction * (sortValue[sortBy](a) - sortValue[sortBy](b)),
    );
  }, [items, filter, query, sortBy, ascending]);

  const filterOptions = useMemo(() => {
    const tiers = [...new Set(items.map((i) => i.tier).filter((t): t is number => !!t))].sort();
    return [
      { value: "all" as FilterType, label: `All (${items.length})` },
      { value: "cities" as FilterType, label: `Major Cities (${items.filter((i) => i.hasCity).length})` },
      ...(tiers.length > 1 ? tiers.map((t) => ({ value: String(t) as FilterType, label: `Tier ${t}` })) : []),
    ];
  }, [items]);

  const fillMetric = sortValue[sortBy === "name" ? "population" : sortBy];
  const fillValues = items.map(fillMetric).filter((v) => v > 0);
  const fillMin = Math.min(...fillValues);
  const fillRange = Math.max(...fillValues) - fillMin || 1;

  const ranks = useMemo(() => {
    if (sortBy === "name") return null;
    const value = sortValue[sortBy];
    return new Map([...items].sort((a, b) => value(b) - value(a)).map((item, i) => [item.id, i + 1]));
  }, [items, sortBy]);

  const changeSort = (next: SortType) => {
    setSortBy(next);
    setAscending(next === "name");
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-bg-secondary animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border-light bg-bg-secondary/40 p-4"
            >
              <div className="mb-3 h-4 w-40 rounded-full bg-bg-tertiary animate-pulse" />
              <div className="mb-1 h-3 w-24 rounded-full bg-bg-tertiary animate-pulse" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="h-2 w-16 rounded-full bg-bg-tertiary animate-pulse" />
                  <div className="h-4 w-20 rounded-full bg-bg-tertiary animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-12 rounded-full bg-bg-tertiary animate-pulse" />
                  <div className="h-4 w-16 rounded-full bg-bg-tertiary animate-pulse" />
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
      <div>
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
      <div>
        <p className="text-text-muted">Data for {stateName} coming soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Filter districts" size="sm" value={filter} onChange={setFilter} options={filterOptions} scrollable />
        <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2">
          {searchOpen || query ? (
            <label className="flex h-9 w-full min-w-0 items-center gap-2 rounded-full border border-border-light bg-bg-secondary px-3 sm:w-48">
              <Icon name="search" size={14} className="shrink-0 text-text-muted" />
              <input
                type="text"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search districts"
                aria-label="Search districts"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
          ) : (
            <Button size="sm" iconOnly onClick={() => setSearchOpen(true)} title="Search districts" aria-label="Search districts">
              <Icon name="search" size={14} />
            </Button>
          )}
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <SegmentedControl label="Sort districts" size="sm" value={sortBy} onChange={changeSort} options={sortOptions} scrollable />
            <Button
              size="sm"
              iconOnly
              onClick={() => setAscending((a) => !a)}
              title={ascending ? "Ascending" : "Descending"}
              aria-label={ascending ? "Sort descending" : "Sort ascending"}
            >
              <Icon name={ascending ? "arrow-up" : "arrow-down"} size={14} />
            </Button>
          </div>
        </div>
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">No districts match these filters.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSorted.map((item, i) => (
          <DistrictItem
            key={item.id}
            item={item}
            delay={i * 0.015}
            rank={ranks?.get(item.id)}
            fill={0.04 + (0.96 * Math.max(fillMetric(item) - fillMin, 0)) / fillRange}
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
  isMajor?: boolean;
}

function DistrictItem({ item, delay, rank, fill, isSelected, onSelect }: { item: ItemWithCity; delay: number; rank?: number; fill: number; isSelected?: boolean; onSelect?: () => void }) {
  const city = item.cityData;
  const { formatPopulation, formatDensity } = useFormat();

  const isCapital = city?.isCapital || item.isCapital;
  const isMetro = city?.isMetro || item.isMetro || city?.tier === 1 || item.tier === 1;
  const [densityValue, densityUnit] = formatDensity(item.density).split("/");
  const showHeadquarters =
    !!item.headquarters && !item.name.toLowerCase().includes(item.headquarters.toLowerCase());

  const handleClick = () => {
    if (!onSelect) return;
    onSelect();
    document.getElementById("state-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(delay, 0.3) }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={!!isSelected}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-colors",
        isSelected
          ? "border-accent-primary bg-accent-primary/10"
          : "border-[color-mix(in_srgb,var(--border-light)_35%,var(--border-medium))] bg-bg-secondary/70 hover:border-text-muted hover:bg-bg-secondary",
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(fill, 0) * 100}%` }}
        transition={{ duration: 0.4, delay: Math.min(delay, 0.3) }}
        className="absolute inset-y-0 left-0 bg-accent-primary/15 transition-colors [mask-image:linear-gradient(to_right,black_85%,transparent)] group-hover:bg-accent-primary/20"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-base font-semibold text-text-primary sm:text-lg">
            {rank && <span className="shrink-0 text-sm font-semibold tabular-nums text-text-muted">{rank}</span>}
            <span className="truncate">{item.name}</span>
            {item.hasCity && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" title="Major city" aria-label="Major city" />
            )}
          </h4>
          {showHeadquarters && <p className="truncate text-xs text-text-muted">HQ: {item.headquarters}</p>}
        </div>
        <div className="shrink-0 pt-0.5">
          <PlaceBadges isCapital={isCapital} isMetro={isMetro} tier={city?.tier || item.tier} />
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-[1fr_1fr_1.35fr_1fr]">
        <Stat size="sm" label="Pop." value={formatPopulation(item.population)} />
        {item.literacyRate > 0 && <Stat size="sm" label="Literacy" value={`${item.literacyRate}%`} />}
        <Stat
          size="sm"
          label="Density"
          value={
            <>
              {densityValue}
              <span className="text-xs font-normal text-text-muted">/{densityUnit}</span>
            </>
          }
        />
        {item.sexRatio > 0 && <Stat size="sm" label="Sex Ratio" value={item.sexRatio} />}
      </div>
    </motion.div>
  );
}
