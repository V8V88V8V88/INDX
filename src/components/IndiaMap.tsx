"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { states } from "@/data/india";
import type { State } from "@/types";

// simplified SVG paths for india states - not geojson accurate but good enough for viz
const statePaths: Record<string, string> = {
  JK: "M 145 45 L 165 35 L 190 40 L 195 60 L 185 80 L 165 85 L 145 75 L 140 55 Z",
  HP: "M 175 80 L 195 75 L 210 85 L 205 105 L 185 110 L 170 100 L 165 85 Z",
  PB: "M 150 95 L 175 90 L 185 110 L 175 130 L 150 130 L 140 115 Z",
  HR: "M 155 130 L 185 125 L 195 145 L 180 165 L 155 160 L 145 145 Z",
  UK: "M 195 90 L 220 85 L 235 100 L 225 125 L 200 130 L 190 110 Z",
  DL: "M 170 148 L 182 145 L 188 155 L 180 165 L 168 162 Z",
  RJ: "M 100 140 L 155 130 L 175 165 L 165 220 L 115 240 L 85 210 L 80 165 Z",
  UP: "M 185 135 L 235 120 L 280 140 L 300 180 L 270 210 L 220 220 L 185 200 L 175 165 Z",
  BR: "M 280 180 L 320 175 L 340 195 L 330 220 L 295 225 L 275 210 Z",
  WB: "M 320 195 L 345 185 L 365 210 L 360 260 L 335 280 L 315 260 L 310 220 Z",
  JH: "M 290 215 L 320 205 L 335 235 L 320 265 L 290 260 L 280 240 Z",
  OR: "M 290 265 L 330 255 L 355 285 L 340 330 L 300 340 L 275 310 L 280 280 Z",
  CG: "M 255 250 L 290 240 L 305 280 L 295 320 L 260 330 L 240 300 L 245 270 Z",
  MP: "M 165 200 L 240 190 L 265 230 L 255 280 L 200 290 L 155 260 L 150 220 Z",
  GJ: "M 60 190 L 110 180 L 130 220 L 120 270 L 70 290 L 40 260 L 35 220 Z",
  MH: "M 95 280 L 155 260 L 200 290 L 210 340 L 180 390 L 120 400 L 80 360 L 75 310 Z",
  GA: "M 108 400 L 125 395 L 130 415 L 115 425 L 100 415 Z",
  KA: "M 100 395 L 145 380 L 175 400 L 175 460 L 140 490 L 95 480 L 85 430 Z",
  KL: "M 105 480 L 135 470 L 155 510 L 145 560 L 115 570 L 100 530 Z",
  TN: "M 135 475 L 185 455 L 215 490 L 200 550 L 155 570 L 125 540 Z",
  AP: "M 175 370 L 240 350 L 275 390 L 260 450 L 200 470 L 165 440 Z",
  TG: "M 195 315 L 255 300 L 275 340 L 260 380 L 210 390 L 185 360 Z",
  AS: "M 380 195 L 430 175 L 455 195 L 450 220 L 410 235 L 375 225 Z",
};

// label positions
const stateCentroids: Record<string, { x: number; y: number }> = {
  JK: { x: 165, y: 60 },
  HP: { x: 188, y: 92 },
  PB: { x: 160, y: 110 },
  HR: { x: 168, y: 148 },
  UK: { x: 210, y: 108 },
  DL: { x: 178, y: 155 },
  RJ: { x: 125, y: 185 },
  UP: { x: 235, y: 170 },
  BR: { x: 305, y: 200 },
  WB: { x: 340, y: 230 },
  JH: { x: 305, y: 240 },
  OR: { x: 315, y: 295 },
  CG: { x: 265, y: 285 },
  MP: { x: 205, y: 240 },
  GJ: { x: 80, y: 235 },
  MH: { x: 145, y: 335 },
  GA: { x: 115, y: 410 },
  KA: { x: 130, y: 440 },
  KL: { x: 125, y: 520 },
  TN: { x: 170, y: 510 },
  AP: { x: 220, y: 410 },
  TG: { x: 225, y: 345 },
  AS: { x: 415, y: 205 },
};

interface IndiaMapProps {
  selectedState?: string | null;
  onStateSelect?: (stateId: string | null) => void;
  colorByMetric?: keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density">;
  interactive?: boolean;
}

export function IndiaMap({
  selectedState,
  onStateSelect,
  colorByMetric = "population",
  interactive = true,
}: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const colorScale = useMemo(() => {
    const values = states.map((s) => s[colorByMetric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (value: number) => {
      const normalized = (value - min) / (max - min);
      const colors = ["#f5f5f4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e"];
      const idx = Math.min(Math.floor(normalized * colors.length), colors.length - 1);
      return colors[idx];
    };
  }, [colorByMetric]);

  const getStateData = useCallback((stateId: string) => {
    return states.find((s) => s.id === stateId);
  }, []);

  const handleStateClick = useCallback(
    (stateId: string) => {
      if (interactive) onStateSelect?.(stateId);
    },
    [interactive, onStateSelect]
  );

  const hoveredData = hoveredState ? getStateData(hoveredState) : null;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 500 600"
        className="w-full h-auto max-h-[600px]"
        style={{ minHeight: "400px" }}
      >
        <rect x="0" y="0" width="500" height="600" fill="transparent" />

        {Object.entries(statePaths).map(([stateId, path]) => {
          const data = getStateData(stateId);
          if (!data) return null;

          const isHovered = hoveredState === stateId;
          const isSelected = selectedState === stateId;
          const fill = colorScale(data[colorByMetric]);

          return (
            <g key={stateId}>
              {interactive ? (
                <Link href={`/state/${stateId}`}>
                  <motion.path
                    d={path}
                    fill={isSelected ? "var(--accent-primary)" : isHovered ? "var(--accent-secondary)" : fill}
                    stroke="var(--bg-card)"
                    strokeWidth={isHovered || isSelected ? 2 : 1}
                    className="cursor-pointer transition-colors"
                    initial={false}
                    animate={{ scale: isHovered ? 1.02 : 1 }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                    onMouseEnter={() => setHoveredState(stateId)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => handleStateClick(stateId)}
                  />
                </Link>
              ) : (
                <path d={path} fill={fill} stroke="var(--bg-card)" strokeWidth={1} />
              )}
            </g>
          );
        })}

        {Object.entries(stateCentroids).map(([stateId, pos]) => {
          const data = getStateData(stateId);
          if (!data) return null;
          const show = hoveredState === stateId || selectedState === stateId;
          if (!show) return null;

          return (
            <text
              key={`lbl-${stateId}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                fill: selectedState === stateId ? "#fff" : "var(--text-primary)",
              }}
            >
              {data.code}
            </text>
          );
        })}
      </svg>

      {hoveredData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-4 left-4 z-10 rounded-xl border border-border-light bg-bg-card p-4 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-text-primary">{hoveredData.name}</h3>
          <p className="mb-2 text-sm text-text-tertiary">
            {hoveredData.region} India · {hoveredData.capital}
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
    </div>
  );
}
