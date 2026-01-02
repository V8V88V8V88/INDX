"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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

  const mapData = useMemo(() => {
    if (!geoData || !geoData.features?.length) {
      return { paths: [], viewBox: "0 0 600 400" };
    }

    const width = 600;
    const height = 400;
    const padding = 30;

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

  if (loading) {
    return (
      <div className="card overflow-hidden p-0">
        <div className="border-b border-border-light bg-bg-secondary px-6 py-4">
          <h3 className="text-lg font-semibold text-text-primary">District Map</h3>
          <p className="text-sm text-text-tertiary">Loading boundaries...</p>
        </div>
        <div className="flex h-[300px] items-center justify-center bg-bg-primary">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!geoData || mapData.paths.length === 0) {
    return (
      <div className="card overflow-hidden p-0">
        <div className="border-b border-border-light bg-bg-secondary px-6 py-4">
          <h3 className="text-lg font-semibold text-text-primary">District Map</h3>
          <p className="text-sm text-text-tertiary">Geographic boundaries of {state.name}</p>
        </div>
        <div className="flex h-[200px] items-center justify-center bg-bg-primary text-text-muted">
          District boundaries not available
        </div>
      </div>
    );
  }

  const hoveredData = hoveredDistrict
    ? mapData.paths.find((p) => p.name === hoveredDistrict)
    : null;

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-border-light bg-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">District Map</h3>
            <p className="text-sm text-text-tertiary">
              {geoData.features.length} districts of {state.name}
            </p>
          </div>
          {hoveredData && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-accent-primary px-3 py-1.5 text-sm font-medium text-white"
            >
              {hoveredData.name}
            </motion.div>
          )}
        </div>
      </div>
      <div className="bg-bg-primary p-4">
        <svg
          ref={svgRef}
          viewBox={mapData.viewBox}
          className="mx-auto w-full"
          style={{ height: "400px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {mapData.paths.map((district, i) => {
            const isHovered = hoveredDistrict === district.name;
            return (
              <path
                key={i}
                d={district.d}
                fill={isHovered ? "var(--accent-primary)" : "var(--accent-muted)"}
                fillOpacity={isHovered ? 0.4 : 0.3}
                stroke="var(--accent-primary)"
                strokeWidth={isHovered ? 1.5 : 0.75}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredDistrict(district.name)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
