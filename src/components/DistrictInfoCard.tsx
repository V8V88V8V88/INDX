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

const tileClass = "rounded-xl bg-accent-primary/10 p-3";

export function DistrictInfoCard({ district, districtName, onClose }: DistrictInfoCardProps) {
  const { formatPopulation, formatArea, formatDensity } = useFormat();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="card p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">{district?.name || districtName}</h3>
          <PlaceBadges isCapital={district?.isCapital} isMetro={district?.isMetro} tier={district?.tier} />
        </div>
        <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </Button>
      </div>

      {district ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat className={tileClass} label="Population" value={formatPopulation(district.population)} />
            <Stat className={tileClass} label="Area" value={formatArea(district.area)} />
            <Stat className={tileClass} label="Density" value={formatDensity(district.density)} />
            <Stat className={tileClass} label="Literacy" value={`${district.literacyRate}%`} />
            {district.sexRatio > 0 && <Stat className={tileClass} label="Sex Ratio" value={district.sexRatio} />}
            {district.headquarters && <Stat className={tileClass} label="Headquarters" value={district.headquarters} />}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Population &amp; sex ratio: 2026 projection · Literacy: Census 2011
          </p>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={tileClass}>
              <div className="mb-2 h-2 w-20 animate-pulse rounded-full bg-bg-tertiary" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-bg-tertiary" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
