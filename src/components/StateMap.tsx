"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import type { State } from "@/types";

interface StateMapProps {
  stateCode: string;
  state: State;
}

interface DistrictFeature {
  type: string;
  properties: {
    district: string;
    dt_code?: string;
    st_nm?: string;
  };
  geometry: unknown;
}

interface DistrictGeoData {
  type: string;
  features: DistrictFeature[];
}

export function StateMap({ stateCode, state }: StateMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<DistrictGeoData | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/geo/states/${stateCode}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setGeoData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGeoData(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  // Reset selected district when state changes
  useEffect(() => {
    setSelectedDistrict(null);
  }, [stateCode]);

  const mapData = useMemo(() => {
    if (!geoData || !geoData.features?.length) {
      return { paths: [], viewBox: "0 0 700 600" };
    }

    const width = 700;
    const height = 600;
    const padding = 20;

    // Combine all features into a single FeatureCollection for fitSize
    const featureCollection = {
      type: "FeatureCollection",
      features: geoData.features,
    };

    const projection = d3.geoMercator().fitSize(
      [width - padding * 2, height - padding * 2],
      featureCollection as unknown as d3.GeoPermissibleObjects
    );

    const [tx, ty] = projection.translate();
    projection.translate([tx + padding, ty + padding]);

    const pathGenerator = d3.geoPath().projection(projection);

    const paths = geoData.features.map((feature) => ({
      d: pathGenerator(feature as unknown as d3.GeoPermissibleObjects) || "",
      name: feature.properties.district || "Unknown",
    }));

    return { paths, viewBox: `0 0 ${width} ${height}` };
  }, [geoData]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Get district info from state data if available
  const selectedDistrictInfo = useMemo(() => {
    if (!selectedDistrict || !state.districts) return null;
    return state.districts.find(
      (d) => d.name.toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [selectedDistrict, state.districts]);

  // Format helper functions
  const formatPopulation = (pop: number) => {
    if (pop >= 10000000) return (pop / 10000000).toFixed(1) + " Cr";
    if (pop >= 100000) return (pop / 100000).toFixed(1) + " L";
    return pop.toLocaleString("en-IN");
  };

  const formatArea = (area: number) => {
    if (area >= 1000) return (area / 1000).toFixed(2) + " K";
    return area.toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-xl bg-bg-secondary/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (!geoData || mapData.paths.length === 0) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-xl bg-bg-secondary/50 text-text-muted">
        District boundaries not available
      </div>
    );
  }

  const hoveredName = hoveredDistrict;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={mapData.viewBox}
        className="w-full h-auto drop-shadow-xl"
        style={{ maxHeight: "700px" }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {mapData.paths.map((district, i) => {
          const isHovered = hoveredDistrict === district.name;
          const isSelected = selectedDistrict === district.name;
          return (
            <motion.path
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                strokeOpacity: 1,
                strokeWidth: isSelected ? 3 : isHovered ? 2.5 : 1.5
              }}
              transition={{ duration: 0.3 }}
              d={district.d}
              stroke="currentColor"
              className={`cursor-pointer transition-all duration-300 ${!isHovered && !isSelected ? "fill-opacity-10 dark:fill-opacity-20" : ""} stroke-[var(--map-border)]`}
              style={{
                filter: isSelected ? "url(#selectedGlow)" : isHovered ? "url(#glow)" : "none",
                fill: isSelected
                  ? "var(--accent-secondary)"
                  : isHovered
                    ? "var(--accent-secondary)"
                    : "var(--accent-primary)"
              }}
              onMouseEnter={() => setHoveredDistrict(district.name)}
              onMouseLeave={() => setHoveredDistrict(null)}
              onClick={() => setSelectedDistrict(district.name === selectedDistrict ? null : district.name)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredName && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-bg-card px-3 py-2 text-sm font-semibold text-text-primary shadow-lg ring-1 ring-border-light backdrop-blur-md"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 12,
          }}
        >
          {hoveredName}
          {selectedDistrict !== hoveredName && (
            <span className="ml-2 text-xs text-text-muted">(click to select)</span>
          )}
        </div>
      )}

      {/* Selected District Info Panel */}
      <AnimatePresence>
        {selectedDistrict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-4 rounded-xl bg-bg-card p-4 ring-1 ring-border-light"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent-secondary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedDistrict}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDistrict(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {selectedDistrictInfo ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-muted mb-1">Population</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatPopulation(selectedDistrictInfo.population)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-muted mb-1">Area</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatArea(selectedDistrictInfo.area)} km²
                  </p>
                </div>
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-muted mb-1">Density</p>
                  <p className="text-xl font-bold text-text-primary">
                    {selectedDistrictInfo.density.toLocaleString("en-IN")}/km²
                  </p>
                </div>
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-muted mb-1">Literacy Rate</p>
                  <p className="text-xl font-bold text-text-primary">
                    {selectedDistrictInfo.literacyRate}%
                  </p>
                </div>
                {selectedDistrictInfo.sexRatio && (
                  <div className="rounded-lg bg-bg-secondary p-3">
                    <p className="text-xs text-text-muted mb-1">Sex Ratio</p>
                    <p className="text-xl font-bold text-text-primary">
                      {selectedDistrictInfo.sexRatio}
                    </p>
                  </div>
                )}
                {selectedDistrictInfo.headquarters && (
                  <div className="rounded-lg bg-bg-secondary p-3">
                    <p className="text-xs text-text-muted mb-1">Headquarters</p>
                    <p className="text-xl font-bold text-text-primary">
                      {selectedDistrictInfo.headquarters}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-bg-secondary p-4 text-center">
                <p className="text-text-muted text-sm">
                  Detailed district data not available yet for {selectedDistrict}
                </p>
                <p className="text-text-tertiary text-xs mt-1">
                  District in {state.name}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
