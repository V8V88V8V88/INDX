"use client";

import { motion } from "framer-motion";
import type { District, City } from "@/types";
import { useFormat } from "@/hooks/useFormat";

interface DistrictInfoCardProps {
  district: District | null;
  selectedCity?: City | null;
  districtName: string | null;
  onClose: () => void;
}

export function DistrictInfoCard({ district, selectedCity, districtName, onClose }: DistrictInfoCardProps) {
  const { formatPopulation, formatArea } = useFormat();

  if (!districtName && !selectedCity) return null;

  // Determine mode
  const mode = selectedCity ? "city" : "district";
  const title = selectedCity ? selectedCity.name : (district?.name || districtName);
  const isCap = selectedCity ? selectedCity.isCapital : district?.isCapital;
  const isMetro = selectedCity ? selectedCity.isMetro : district?.isMetro;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-secondary" />
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <span>{title}</span>
            {isCap && (
              <span className="rounded bg-accent-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Capital
              </span>
            )}
            {isMetro && (
              <span className="rounded bg-accent-secondary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Metro
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted hover:bg-bg-secondary hover:text-text-primary transition-all"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {(selectedCity || district) ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Population</p>
            <p className="text-lg font-bold text-text-primary">
              {formatPopulation(selectedCity ? selectedCity.population : district!.population)}
            </p>
          </div>
          <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Area</p>
            <p className="text-lg font-bold text-text-primary">
              {formatArea(selectedCity ? selectedCity.area : district!.area)}
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">km²</p>
          </div>
          <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Density</p>
            <p className="text-base font-bold text-text-primary">
              {selectedCity
                ? Math.round(selectedCity.population / (selectedCity.area || 1)).toLocaleString("en-IN")
                : district!.density.toLocaleString("en-IN")
              }
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">per km²</p>
          </div>

          {/* Extended District Stats (Only show for Districts) */}
          {!selectedCity && district && (
            <>
              <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Literacy</p>
                <p className="text-base font-bold text-text-primary">
                  {district.literacyRate}%
                </p>
              </div>
              {district.sexRatio > 0 && (
                <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Sex Ratio</p>
                  <p className="text-base font-bold text-text-primary">
                    {district.sexRatio}
                  </p>
                </div>
              )}
              {district.headquarters && (
                <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Headquarters</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {district.headquarters}
                  </p>
                </div>
              )}
              {district.tier && (
                <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Tier</p>
                  <p className="text-base font-bold text-text-primary">
                    Tier {district.tier}
                  </p>
                </div>
              )}
            </>
          )}

          {/* City Specific Stats */}
          {selectedCity && (
            <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Tier</p>
              <p className="text-base font-bold text-text-primary">
                Tier {selectedCity.tier}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-accent-primary/10 p-3 border border-border-light/40"
            >
              <div className="h-2 w-20 rounded bg-bg-secondary animate-pulse mb-2" />
              <div className="h-5 w-24 rounded bg-bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      )}

    </motion.div>
  );
}
