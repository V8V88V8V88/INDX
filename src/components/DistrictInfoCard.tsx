"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { District } from "@/types";
import { useFormat } from "@/hooks/useFormat";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { cn } from "@/lib/cn";
import { PlaceBadges } from "./PlaceBadges";
import { Button, Icon, Stat } from "./ui";

interface DistrictInfoCardProps {
  district: District | null;
  districtName: string;
  onClose: () => void;
  className?: string;
}

const statClass = "px-3 py-2.5";

export function DistrictInfoCard({ district, districtName, onClose, className }: DistrictInfoCardProps) {
  const { formatPopulation, formatArea, formatDensity } = useFormat();
  const t = useTranslations("Districts");
  const tCommon = useTranslations("Common");
  const tMetrics = useTranslations("Metrics");
  const { placeName } = usePlaceNames();
  const name = district?.name || districtName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("card overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-light py-2 pl-4 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-semibold text-text-primary">{district ? placeName(district.stateId, name) : name}</h3>
          <PlaceBadges isCapital={district?.isCapital} isMetro={district?.isMetro} tier={district?.tier} />
        </div>
        <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label={tCommon("close")}>
          <Icon name="close" />
        </Button>
      </div>

      {district ? (
        <div
          className="grid grid-cols-3 p-1"
          title={t("infoSources")}
        >
          <Stat className={statClass} size="sm" label={tMetrics("population.short")} value={formatPopulation(district.population)} />
          <Stat className={statClass} size="sm" label={tMetrics("area.short")} value={formatArea(district.area)} />
          <Stat className={statClass} size="sm" label={tMetrics("density.short")} value={formatDensity(district.density)} />
          <Stat className={statClass} size="sm" label={tMetrics("literacyRate.short")} value={`${district.literacyRate}%`} />
          {district.sexRatio > 0 && <Stat className={statClass} size="sm" label={tMetrics("sexRatio.short")} value={district.sexRatio} />}
          {district.headquarters && <Stat className={statClass} size="sm" label={t("hq")} value={placeName(district.stateId, district.headquarters)} />}
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
