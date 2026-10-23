"use client";

import { motion } from "framer-motion";
import type { District } from "@/types";
import { useFormat } from "@/hooks/useFormat";
import { PlaceBadges } from "./PlaceBadges";
import { Button, Icon, Stat } from "./ui";

interface DistrictInfoCardProps {
  district: District | null;
  districtName: string;
  onClose: () => void;
}

const statClass = "px-3 py-2.5";

export function DistrictInfoCard({ district, districtName, onClose }: DistrictInfoCardProps) {
  const { formatPopulation, formatArea, formatDensity } = useFormat();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-light py-2 pl-4 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-semibold text-text-primary">{district?.name || districtName}</h3>
          <PlaceBadges isCapital={district?.isCapital} isMetro={district?.isMetro} tier={district?.tier} />
        </div>
        <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </Button>
      </div>

      {district ? (
        <div
          className="grid grid-cols-3 p-1"
          title="Population & sex ratio: 2026 projection · Literacy: Census 2011"
        >
          <Stat className={statClass} size="sm" label="Population" value={formatPopulation(district.population)} />
          <Stat className={statClass} size="sm" label="Area" value={formatArea(district.area)} />
          <Stat className={statClass} size="sm" label="Density" value={formatDensity(district.density)} />
          <Stat className={statClass} size="sm" label="Literacy" value={`${district.literacyRate}%`} />
          {district.sexRatio > 0 && <Stat className={statClass} size="sm" label="Sex Ratio" value={district.sexRatio} />}
          {district.headquarters && <Stat className={statClass} size="sm" label="HQ" value={district.headquarters} />}
        </div>
      ) : (
        <div className="grid grid-cols-3 p-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className={statClass}>
              <div className="mb-2 h-2 w-14 animate-pulse rounded-full bg-bg-tertiary" />
              <div className="h-4 w-16 animate-pulse rounded-full bg-bg-tertiary" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
