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
      const proj = d3.geoMercator().center([82, 22]).scale(1000);
      const pathGen = d3.geoPath().projection(proj);
      return { pathGenerator: pathGen, viewBox: "0 0 600 400", path: "" };
    }

    const width = 600;
    const height = 400;
    const proj = d3.geoMercator().precision(0.1);
    const pathGen = d3.geoPath().projection(proj);
    
    const bounds = pathGen.bounds(stateFeature as unknown as d3.GeoPermissibleObjects);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = 0.9 / Math.max(dx / width, dy / height);
    const translate: [number, number] = [width / 2 - scale * x, height / 2 - scale * y];
    
    proj.scale(scale).translate(translate);
    
    const newBounds = pathGen.bounds(stateFeature as unknown as d3.GeoPermissibleObjects);
    const padding = 20;
    const vb = `${newBounds[0][0] - padding} ${newBounds[0][1] - padding} ${newBounds[1][0] - newBounds[0][0] + padding * 2} ${newBounds[1][1] - newBounds[0][1] + padding * 2}`;
    
    const pathStr = pathGen(stateFeature as unknown as d3.GeoPermissibleObjects) || "";
    
    return { pathGenerator: pathGen, viewBox: vb, path: pathStr };
  }, [stateFeature]);

  if (!geoData || !stateFeature) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border-light bg-bg-secondary">
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
      <div className="bg-bg-secondary p-4">
        <svg
          ref={svgRef}
          viewBox={mapData.viewBox}
          className="w-full"
          style={{ minHeight: "400px", maxHeight: "500px" }}
        >
          <path
            d={mapData.path}
            fill="var(--accent-primary)"
            fillOpacity={0.2}
            stroke="var(--accent-primary)"
            strokeWidth={1.5}
          />
        </svg>
      </div>
    </div>
  );
}

