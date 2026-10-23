"use client";

import type { City } from "@/types";
import { useFormat } from "@/hooks/useFormat";
import { PlaceBadges } from "./PlaceBadges";
import { Card, Stat } from "./ui";

interface CityCardProps {
  city: City;
  stateName: string;
}

export function CityCard({ city, stateName }: CityCardProps) {
  const { formatPopulation, formatArea, formatDensity } = useFormat();

  return (
    <Card className="p-5">
      <PlaceBadges isCapital={city.isCapital} isMetro={city.isMetro} tier={city.tier} />
      <h3 className="mt-3 text-lg font-semibold text-text-primary">{city.name}</h3>
      <p className="mb-4 text-sm text-text-tertiary">{stateName}</p>
      <div className="grid grid-cols-3 gap-3">
        <Stat size="sm" label="Population" value={formatPopulation(city.population)} />
        <Stat size="sm" label="Area" value={formatArea(city.area)} />
        <Stat size="sm" label="Density" value={formatDensity(Math.round(city.population / city.area))} />
      </div>
    </Card>
  );
}
