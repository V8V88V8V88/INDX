"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import type { State } from "@/types";

interface StateMapProps {
  stateCode: string;
  state: State;
  selectedDistrict?: string | null;
  onDistrictSelect?: (district: string | null) => void;
  onDistrictClick?: (district: string) => void;
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

export function StateMap({ stateCode, state, selectedDistrict: externalSelectedDistrict, onDistrictSelect, onDistrictClick }: StateMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<DistrictGeoData | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [internalSelectedDistrict, setInternalSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedDistrict = externalSelectedDistrict !== undefined ? externalSelectedDistrict : internalSelectedDistrict;
  const setSelectedDistrict = onDistrictSelect || setInternalSelectedDistrict;

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

  useEffect(() => {
    setSelectedDistrict(null);
  }, [stateCode, setSelectedDistrict]);

  const normalizeGeoDistrictName = (geoName: string, stateCode: string): string => {
    if (stateCode === "DL") {
      if (geoName === "New Delhi" || geoName === "Shahdara") {
        return geoName;
      }
      if (!geoName.endsWith("Delhi")) {
        return `${geoName} Delhi`;
      }
    }
    return geoName;
  };

  const mapData = useMemo(() => {
    if (!geoData || !geoData.features?.length) {
      return { paths: [], viewBox: "0 0 700 600" };
    }

    const width = 700;
    const height = 600;
    const padding = 20;

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
      name: normalizeGeoDistrictName(feature.properties.district || "Unknown", stateCode),
    }));

    return { paths, viewBox: `0 0 ${width} ${height}` };
  }, [geoData, stateCode]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    <div className="relative w-full" style={{ overflow: "visible" }}>
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
          const hasActiveDistrict = hoveredDistrict || selectedDistrict;
          const isInactive = hasActiveDistrict && !isHovered && !isSelected;

          return (
            <motion.path
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: isInactive ? 0.25 : 1,
                scale: 1,
                strokeOpacity: isInactive ? 0.3 : 1,
                strokeWidth: isSelected ? 3 : isHovered ? 2.5 : 1.5
              }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              d={district.d}
              stroke="var(--bg-card)"
              className={`cursor-pointer transition-all duration-150`}
              style={{
                filter: isSelected ? "url(#selectedGlow)" : isHovered ? "url(#glow)" : "none",
                fill: isSelected
                  ? "var(--accent-secondary)"
                  : isHovered
                    ? "var(--accent-secondary)"
                    : "var(--accent-primary)",
                fillOpacity: isSelected || isHovered
                  ? 0.7
                  : hasActiveDistrict
                    ? 0.15
                    : 0.6
              }}
              onMouseEnter={() => setHoveredDistrict(district.name)}
              onMouseLeave={() => setHoveredDistrict(null)}
              onClick={() => {
                const newSelection = district.name === selectedDistrict ? null : district.name;
                setSelectedDistrict(newSelection);
                if (newSelection && onDistrictClick) {
                  onDistrictClick(newSelection);
                }
              }}
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
            <span className="ml-2 text-xs text-text-muted">(click for details)</span>
          )}
        </div>
      )}

    </div>
  );
}
