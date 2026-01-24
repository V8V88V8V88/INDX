"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const rafRef = useRef<number | null>(null);
  const { formatPopulation, formatDensity, formatCurrency, formatArea } = useFormat();

  useEffect(() => {
    fetch("/india-states.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    let zoomRafId: number | null = null;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .wheelDelta((event) => {
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * 3;
      })
      .on("zoom", (event) => {
        if (zoomRafId) return;
        zoomRafId = requestAnimationFrame(() => {
          setTransform({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
          zoomRafId = null;
        });
      });

    zoomRef.current = zoom;
    const svgNode = svgRef.current;
    d3.select(svgNode).call(zoom);

    return () => {
      d3.select(svgNode).on(".zoom", null);
      if (zoomRafId) cancelAnimationFrame(zoomRafId);
    };
  }, [geoData]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .call(zoomRef.current.transform as any, d3.zoomIdentity)
      .on("end", () => setTransform({ k: 1, x: 0, y: 0 }));
  }, []);

  const colorScale = useMemo(() => {
    const stateValues = states
      .map((s) => ({
        id: s.id,
        value: s[colorByMetric],
      }))
      .filter((item) => item.value != null) as { id: string; value: number }[];

    if (stateValues.length === 0) {
      return () => "var(--accent-primary)";
    }

    stateValues.sort((a, b) => b.value - a.value);

    const rankMap = new Map<string, number>();
    stateValues.forEach((item, index) => {
      rankMap.set(item.id, index);
    });

    let colors = ["var(--choro-0)", "var(--choro-1)", "var(--choro-3)", "var(--choro-5)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];

    if (colorByMetric === "sexRatio") {
      colors = ["var(--choro-1)", "var(--choro-2)", "var(--choro-4)", "var(--choro-5)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];
    } else if (colorByMetric === "area") {
      colors = ["var(--choro-0)", "var(--choro-1)", "var(--choro-2)", "var(--choro-4)", "var(--choro-6)", "var(--choro-7)", "var(--choro-8)", "var(--choro-9)"];
    } else if (colorByMetric === "hdi" || colorByMetric === "literacyRate") {
      colors = ["var(--choro-1)", "var(--choro-2)", "var(--choro-3)", "var(--choro-5)", "var(--choro-6)", "var(--choro-8)", "var(--choro-9)"];
    }

    return (value: number | undefined, stateId?: string) => {
      if (value == null || !stateId) return "var(--accent-primary)";

      const rank = rankMap.get(stateId);
      if (rank == null) return "var(--accent-primary)";

      const t = rank / (stateValues.length - 1);
      const idx = Math.min(Math.floor(t * colors.length), colors.length - 1);
      return colors[colors.length - 1 - idx];
    };
  }, [colorByMetric]);

  const getStateData = useCallback((code: string) => states.find((s) => s.id === code), []);
  const getStateCode = useCallback((name: string) => stateNameToCode[name] || null, []);

  const projection = useMemo(() => {
    return d3.geoMercator().center([82, 22]).scale(1150).translate([300, 340]);
  }, []);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const precomputedPaths = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature) => {
      const stateName = feature.properties.ST_NM;
      const stateCode = stateNameToCode[stateName] || null;
      const stateData = stateCode ? states.find((s) => s.id === stateCode) : null;
      const pathString = pathGenerator(feature as unknown as d3.GeoPermissibleObjects) || "";
      const centroid = pathGenerator.centroid(feature as unknown as d3.GeoPermissibleObjects);
      const isTinyUT = ["LD", "CH", "DD", "PY"].includes(stateCode || "");
      return { feature, stateName, stateCode, stateData, pathString, centroid, isTinyUT };
    });
  }, [geoData, pathGenerator]);

  const hoveredData = hoveredState ? states.find((s) => s.id === hoveredState) : null;

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
          minHeight: "380px",
          maxHeight: "520px",
          cursor: "grab",
          willChange: "transform"
        }}
        onMouseMove={(e) => {
          if (rafRef.current) return;
          rafRef.current = requestAnimationFrame(() => {
            setMousePos({ x: e.clientX, y: e.clientY });
            rafRef.current = null;
          });
        }}
      >
        <g ref={gRef} transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {precomputedPaths.map((item, i) => {
            const { stateCode, stateData, pathString, centroid, isTinyUT } = item;

            const isHovered = hoveredState === stateCode;
            const isSelected = selectedState === stateCode;

            let fill = "var(--accent-primary)";
            if (stateData) {
              const metricValue = stateData[colorByMetric];
              fill = colorScale(metricValue, stateCode || undefined);
            }
            if (isSelected) fill = "var(--accent-secondary)";
            if (isHovered) fill = "var(--accent-secondary)";

            const pathContent = (
              <g key={`path-${i}`}>
                <path
                  d={pathString}
                  fill={fill}
                  stroke="var(--map-border-color)"
                  strokeWidth={(isHovered || isSelected ? 1.1 : 0.6) / transform.k}
                  style={{ cursor: interactive && stateCode ? "pointer" : "default", willChange: "fill" }}
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
                    style={{ cursor: "pointer", willChange: "fill, r" }}
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
          {showLabels && precomputedPaths.map((item, i) => {
            const { stateCode, stateData, centroid, isTinyUT } = item;
            const isHovered = hoveredState === stateCode;
            const isSelected = selectedState === stateCode;

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
                  stroke="var(--bg-card)"
                  strokeWidth="4"
                  strokeOpacity="0.9"
                  fill="var(--text-primary)"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontWeight: isHovered || isSelected ? "600" : "500",
                    opacity: isHovered || isSelected ? 1 : 0.9,
                    paintOrder: "stroke fill",
                  }}
                >
                  <tspan x={labelX} dy="0" stroke="var(--bg-card)" strokeWidth="4" strokeOpacity="0.9" fill="var(--text-primary)" style={{ paintOrder: "stroke fill" }}>Dadra & Nagar Haveli</tspan>
                  <tspan x={labelX} dy={lineHeight} stroke="var(--bg-card)" strokeWidth="4" strokeOpacity="0.9" fill="var(--text-primary)" style={{ paintOrder: "stroke fill" }}>&amp; Daman &amp; Diu</tspan>
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
                stroke="var(--bg-card)"
                strokeWidth="3"
                strokeOpacity="0.8"
                fill="var(--text-primary)"
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
        const countryAvg = states.reduce((sum, s) => {
          const val = s[colorByMetric];
          return sum + (val ?? 0);
        }, 0) / states.length;
        const stateValue = hoveredData[colorByMetric] ?? 0;

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
          onClick={() => setShowLabels(!showLabels)}
          className={`flex h-10 items-center gap-1.5 rounded-lg border border-border-light px-3 text-xs font-medium shadow-md transition-colors ${showLabels ? 'bg-accent-primary text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'}`}
          title={showLabels ? "Hide labels" : "Show labels"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          Labels
        </button>
        <Link
          href="/map"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-bg-card text-text-secondary shadow-md transition-colors hover:bg-bg-secondary"
          title="Fullscreen map (zoom to districts & tehsils)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </Link>
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

  return <div className="relative">{mapContent}</div>;
}
