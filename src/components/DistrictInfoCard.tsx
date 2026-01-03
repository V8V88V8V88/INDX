"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { District } from "@/types";
import { useFormat } from "@/hooks/useFormat";

interface DistrictInfoCardProps {
  district: District | null;
  districtName: string | null;
  onClose: () => void;
}

export function DistrictInfoCard({ district, districtName, onClose }: DistrictInfoCardProps) {
  const { formatPopulation, formatArea } = useFormat();

  if (!districtName) return null;

  return (
    <AnimatePresence>
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
            <h3 className="text-base font-semibold text-text-primary">
              {district?.name || districtName}
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

        {district ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Population</p>
              <p className="text-lg font-bold text-text-primary">
                {formatPopulation(district.population)}
              </p>
            </div>
            <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Area</p>
              <p className="text-lg font-bold text-text-primary">
                {formatArea(district.area)}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">km²</p>
            </div>
            <div className="rounded-lg bg-accent-primary/15 p-3 border border-border-light/50">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1">Density</p>
              <p className="text-base font-bold text-text-primary">
                {district.density.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">per km²</p>
            </div>
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
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-text-muted font-medium mb-1">
              Data loading...
            </p>
            <p className="text-text-tertiary text-sm">
              Fetching district information
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

