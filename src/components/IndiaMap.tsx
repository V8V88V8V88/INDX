"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as d3 from "d3";
import { states } from "@/data/india";
import type { State } from "@/types";

const stateNameToCode: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chhattisgarh": "CG",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OR",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TG",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UK",
  "West Bengal": "WB",
  "Delhi": "DL",
  "Jammu & Kashmir": "JK",
  "Ladakh": "LA",
  "Puducherry": "PY",
  "Chandigarh": "CH",
  "Andaman & Nicobar": "AN",
  "Lakshadweep": "LD",
  "Dadra and Nagar Haveli and Daman and Diu": "DD",
};

interface IndiaMapProps {
  selectedState?: string | null;
  onStateSelect?: (stateId: string | null) => void;
  colorByMetric?: keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density">;
  interactive?: boolean;
}

interface GeoFeature {
  type: string;
  properties: { ST_NM: string };
  geometry: unknown;
}

interface GeoData {
  type: string;
  features: GeoFeature[];
}

export function IndiaMap({
  selectedState,
  onStateSelect,
  colorByMetric = "population",
  interactive = true,
}: IndiaMapProps) {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch("/india-states.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  // esc to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const colorScale = useMemo(() => {
    const values = states.map((s) => s[colorByMetric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (value: number) => {
      const t = (value - min) / (max - min);
      const colors = ["#f5f5f4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e"];
      const idx = Math.min(Math.floor(t * colors.length), colors.length - 1);
      return colors[idx];
    };
  }, [colorByMetric]);

  const getStateData = useCallback((code: string) => states.find((s) => s.id === code), []);
  const getStateCode = useCallback((name: string) => stateNameToCode[name] || null, []);

  const projection = useMemo(() => {
    return d3.geoMercator().center([82, 23]).scale(1100).translate([280, 320]);
  }, []);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const hoveredData = hoveredState ? getStateData(hoveredState) : null;

  if (!geoData) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-text-muted">Loading map...</div>
      </div>
    );
  }

  const mapContent = (
    <>
      <svg
        viewBox="0 0 560 700"
        className="w-full h-auto"
        style={{ 
          minHeight: isFullscreen ? "70vh" : "380px",
          maxHeight: isFullscreen ? "85vh" : "520px"
        }}
      >
        {geoData.features.map((feature, i) => {
          const stateName = feature.properties.ST_NM;
          const stateCode = getStateCode(stateName);
          const stateData = stateCode ? getStateData(stateCode) : null;

          const isHovered = hoveredState === stateCode;
          const isSelected = selectedState === stateCode;

          let fill = "#e7e5e4";
          if (stateData) fill = colorScale(stateData[colorByMetric]);
          if (isSelected) fill = "var(--accent-primary)";
          if (isHovered) fill = "var(--accent-secondary)";

          const path = pathGenerator(feature as unknown as d3.GeoPermissibleObjects) || "";

          const content = (
            <path
              key={i}
              d={path}
              fill={fill}
              stroke="var(--bg-card)"
              strokeWidth={isHovered || isSelected ? 1.5 : 0.5}
              className="transition-colors duration-150"
              style={{ cursor: interactive && stateCode ? "pointer" : "default" }}
              onMouseEnter={() => stateCode && setHoveredState(stateCode)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => interactive && stateCode && onStateSelect?.(stateCode)}
            />
          );

          if (interactive && stateData) {
            return (
              <Link key={i} href={`/state/${stateCode}`}>
                {content}
              </Link>
            );
          }
          return content;
        })}
      </svg>

      {/* tooltip */}
      {hoveredData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 left-4 z-10 rounded-xl border border-border-light bg-bg-card p-4 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-text-primary">{hoveredData.name}</h3>
          <p className="mb-2 text-sm text-text-tertiary">
            {hoveredData.region} · {hoveredData.capital}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Population</span>
              <span className="font-mono text-text-secondary">
                {(hoveredData.population / 10000000).toFixed(1)} Cr
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Literacy</span>
              <span className="font-mono text-text-secondary">{hoveredData.literacyRate}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">HDI</span>
              <span className="font-mono text-text-secondary">{hoveredData.hdi.toFixed(3)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Density</span>
              <span className="font-mono text-text-secondary">{hoveredData.density}/km²</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* fullscreen toggle */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-bg-card text-text-secondary shadow-md transition-colors hover:bg-bg-secondary"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </>
  );

  return (
    <>
      <div className="relative">{mapContent}</div>

      {/* fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm p-8"
            onClick={(e) => e.target === e.currentTarget && setIsFullscreen(false)}
          >
            <div className="relative w-full max-w-5xl">{mapContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
