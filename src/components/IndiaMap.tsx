"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as d3 from "d3";
import { states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
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
  colorByMetric?: keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area">;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { formatPopulation, formatDensity, formatCurrency, formatArea } = useFormat();

  useEffect(() => {
    fetch("/india-states.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .wheelDelta((event) => {
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * 3;
      })
      .on("zoom", (event) => {
        setTransform({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
      });

    zoomRef.current = zoom;
    const svgNode = svgRef.current;
    d3.select(svgNode).call(zoom);

    return () => {
      d3.select(svgNode).on(".zoom", null);
    };
  }, [geoData]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

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

      let colors = ["var(--choro-0)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-8)"]; // Default dynamic scale

      if (colorByMetric === "sexRatio") {
        // Use dynamic scale for Sex Ratio as well (follows theme)
        colors = ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
      } else if (colorByMetric === "area") {
        // Dynamic scale for Area
        colors = ["var(--choro-0)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-8)"];
      } else if (colorByMetric === "hdi" || colorByMetric === "literacyRate") {
        // Dynamic scale for positive development indicators
        colors = ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
      } else if (colorByMetric === "density" || colorByMetric === "population" || colorByMetric === "gdp") {
        // Dynamic scale for intensity metrics
        colors = ["var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-9)"];
      }

      const idx = Math.min(Math.floor(t * colors.length), colors.length - 1);
      return colors[idx];
    };
  }, [colorByMetric]);

  const getStateData = useCallback((code: string) => states.find((s) => s.id === code), []);
  const getStateCode = useCallback((name: string) => stateNameToCode[name] || null, []);

  const projection = useMemo(() => {
    return d3.geoMercator().center([82, 22]).scale(1000).translate([300, 300]);
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
        ref={svgRef}
        viewBox="-80 -20 700 720"
        className="w-full h-auto touch-none"
        style={{
          minHeight: isFullscreen ? "70vh" : "380px",
          maxHeight: isFullscreen ? "85vh" : "520px",
          cursor: "grab"
        }}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        <g ref={gRef} transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Render paths first */}
          {geoData.features.map((feature, i) => {
            const stateName = feature.properties.ST_NM;
            const stateCode = getStateCode(stateName);
            const stateData = stateCode ? getStateData(stateCode) : null;

            const isHovered = hoveredState === stateCode;
            const isSelected = selectedState === stateCode;

            let fill = "var(--accent-primary)";
            if (stateData) fill = colorScale(stateData[colorByMetric]);
            if (isSelected) fill = "var(--accent-secondary)";
            if (isHovered) fill = "var(--accent-secondary)";

            const path = pathGenerator(feature as unknown as d3.GeoPermissibleObjects) || "";
            const centroid = pathGenerator.centroid(feature as unknown as d3.GeoPermissibleObjects);

            // microscopic UTs need visible markers
            const isTinyUT = ["LD", "CH", "DD", "PY"].includes(stateCode || "");

            const pathContent = (
              <g key={`path-${i}`}>
                <path
                  d={path}
                  fill={fill}
                  stroke="var(--text-muted)"
                  strokeWidth={(isHovered || isSelected ? 1.5 : 0.75) / transform.k}
                  className="transition-colors duration-150"
                  style={{ cursor: interactive && stateCode ? "pointer" : "default" }}
                  onMouseEnter={() => stateCode && setHoveredState(stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => interactive && stateCode && onStateSelect?.(stateCode)}
                >
                </path>
                {/* marker for tiny UTs */}
                {isTinyUT && centroid[0] && centroid[1] && (
                  <circle
                    cx={centroid[0]}
                    cy={centroid[1]}
                    r={(isHovered ? 6 : 4) / transform.k}
                    fill={fill}
                    stroke={isHovered ? "var(--accent-primary)" : "var(--text-tertiary)"}
                    strokeWidth={1 / transform.k}
                    className="transition-all duration-150"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => stateCode && setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                  >
                  </circle>
                )}
              </g>
            );

            if (interactive && stateData) {
              return (
                <Link key={`link-${i}`} href={`/state/${stateCode}`}>
                  {pathContent}
                </Link>
              );
            }
            return pathContent;
          })}
          {/* Render text labels on top */}
          {geoData.features.map((feature, i) => {
            const stateName = feature.properties.ST_NM;
            const stateCode = getStateCode(stateName);
            const stateData = stateCode ? getStateData(stateCode) : null;
            const isHovered = hoveredState === stateCode;
            const isSelected = selectedState === stateCode;
            const path = pathGenerator(feature as unknown as d3.GeoPermissibleObjects) || "";
            const centroid = pathGenerator.centroid(feature as unknown as d3.GeoPermissibleObjects);
            const isTinyUT = ["LD", "CH", "DD", "PY"].includes(stateCode || "");

            if (!centroid[0] || !centroid[1] || !stateData) return null;

            let labelX = centroid[0];
            let labelY = centroid[1];
            const fontSize = Math.max(isTinyUT ? 8 : 10, (isTinyUT ? 10 : 12) / transform.k);

            if (stateCode === "CH") {
              labelY = centroid[1] - (10 / transform.k);
            }

            if (stateCode === "DD") {
              const lineHeight = fontSize * 1.2;
              return (
                <text
                  key={`text-${i}`}
                  x={labelX}
                  y={labelY - lineHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  className="pointer-events-none select-none"
                  stroke="white"
                  strokeWidth="3"
                  strokeOpacity="0.8"
                  fill="#000000"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontWeight: isHovered || isSelected ? "600" : "500",
                    opacity: isHovered || isSelected ? 1 : 0.9,
                    paintOrder: "stroke fill",
                  }}
                >
                  <tspan x={labelX} dy="0" stroke="white" strokeWidth="3" strokeOpacity="0.8" fill="#000000" style={{ paintOrder: "stroke fill" }}>Dadra & Nagar Haveli</tspan>
                  <tspan x={labelX} dy={lineHeight} stroke="white" strokeWidth="3" strokeOpacity="0.8" fill="#000000" style={{ paintOrder: "stroke fill" }}>& Daman & Diu</tspan>
                </text>
              );
            }

            return (
              <text
                key={`text-${i}`}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                stroke="white"
                strokeWidth="3"
                strokeOpacity="0.8"
                fill="#000000"
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: isHovered || isSelected ? "600" : "500",
                  opacity: isHovered || isSelected ? 1 : 0.9,
                  paintOrder: "stroke fill",
                }}
              >
                {stateData.name}
              </text>
            );
          })}
        </g>
      </svg>

      {/* tooltip */}
      {hoveredData && (() => {
        const countryAvg = states.reduce((sum, s) => sum + s[colorByMetric], 0) / states.length;
        const stateValue = hoveredData[colorByMetric];

        const formatValue = (value: number) => {
          if (colorByMetric === "population") return formatPopulation(value);
          if (colorByMetric === "density") return formatDensity(value);
          if (colorByMetric === "gdp") return formatCurrency(value * 10000000);
          if (colorByMetric === "literacyRate" || colorByMetric === "hdi") return value.toFixed(colorByMetric === "hdi" ? 3 : 1) + (colorByMetric === "literacyRate" ? "%" : "");
          if (colorByMetric === "sexRatio") return value.toString();
          if (colorByMetric === "area") return formatArea(value);
          return value.toString();
        };

        const metricLabel = colorByMetric === "literacyRate" ? "Literacy Rate" :
          colorByMetric === "sexRatio" ? "Sex Ratio" :
            colorByMetric.toUpperCase();

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 z-10 rounded-xl border border-border-light bg-bg-card p-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-text-primary">{hoveredData.name}</h3>
            <p className="mb-3 text-sm text-text-tertiary">
              {hoveredData.region} · {hoveredData.capital}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">{metricLabel}</span>
                <span className="font-mono font-semibold text-text-secondary">
                  {formatValue(stateValue)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">Country Average</span>
                <span className="font-mono text-text-tertiary">
                  {formatValue(countryAvg)}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        {transform.k !== 1 && (
          <button
            onClick={resetZoom}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-border-light bg-bg-card px-3 text-xs font-medium text-text-secondary shadow-md transition-colors hover:bg-bg-secondary"
            title="Reset zoom"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        )}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-bg-card text-text-secondary shadow-md transition-colors hover:bg-bg-secondary"
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
      </div>

      {/* zoom level indicator */}
      {transform.k !== 1 && (
        <div className="absolute top-4 right-4 z-10 rounded-lg bg-bg-card/90 px-2 py-1 text-xs font-mono text-text-muted border border-border-light">
          {Math.round(transform.k * 100)}%
        </div>
      )}

      {/* instant hover label */}
      {hoveredState && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-bg-primary shadow-lg"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 8,
          }}
        >
          {getStateData(hoveredState)?.name || hoveredState}
        </div>
      )}
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
