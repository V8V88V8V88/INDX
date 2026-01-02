"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as d3 from "d3";
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

interface StateMapProps {
  stateCode: string;
  state: State;
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

export function StateMap({ stateCode, state }: StateMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);

  useEffect(() => {
    fetch("/india-states.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  const stateFeature = useMemo(() => {
    if (!geoData) return null;
    return geoData.features.find((f) => {
      const code = stateNameToCode[f.properties.ST_NM];
      return code === stateCode;
    });
  }, [geoData, stateCode]);

  const mapData = useMemo(() => {
    if (!stateFeature) {
      return { path: "", viewBox: "0 0 600 400" };
    }

    const width = 600;
    const height = 400;
    const padding = 40;

    // Use fitSize to properly scale and center the state
    const projection = d3.geoMercator().fitSize(
      [width - padding * 2, height - padding * 2],
      stateFeature as unknown as d3.GeoPermissibleObjects
    );
    
    // Adjust translate to account for padding
    const [tx, ty] = projection.translate();
    projection.translate([tx + padding, ty + padding]);

    const pathGenerator = d3.geoPath().projection(projection);
    const pathStr = pathGenerator(stateFeature as unknown as d3.GeoPermissibleObjects) || "";

    return { path: pathStr, viewBox: `0 0 ${width} ${height}` };
  }, [stateFeature]);

  if (!geoData || !stateFeature) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border-light bg-bg-secondary">
        <div className="text-text-muted">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-border-light bg-bg-secondary px-6 py-4">
        <h3 className="text-lg font-semibold text-text-primary">State Map</h3>
        <p className="text-sm text-text-tertiary">Geographic boundaries of {state.name}</p>
      </div>
      <div className="bg-bg-primary p-4">
        <svg
          ref={svgRef}
          viewBox={mapData.viewBox}
          className="mx-auto w-full max-w-lg"
          style={{ height: "300px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={mapData.path}
            fill="var(--accent-primary)"
            fillOpacity={0.15}
            stroke="var(--accent-primary)"
            strokeWidth={2}
          />
        </svg>
      </div>
    </div>
  );
}
