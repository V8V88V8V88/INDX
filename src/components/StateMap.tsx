"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { useSubDistrictGeoData, filterSubDistrictsByDistrict } from "@/hooks/useSubDistrictGeoData";
import type { State } from "@/types";

interface StateMapProps {
  stateCode: string;
  state: State;
  selectedDistrict?: string | null;
  onDistrictSelect?: (district: string | null) => void;
  onDistrictClick?: (district: string) => void;
  onCityClick?: (city: any) => void;
  onSubDistrictClick?: (subDistrict: { name: string; district: string }) => void;
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

export function StateMap({ stateCode, state, selectedDistrict: externalSelectedDistrict, onDistrictSelect, onDistrictClick, onCityClick, onSubDistrictClick }: StateMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<DistrictGeoData | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredSubDistrict, setHoveredSubDistrict] = useState<string | null>(null);
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
    setHoveredDistrict(null);
  }, [stateCode, setSelectedDistrict]);

  // Handle ESC key to unselect district
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDistrict) {
        setSelectedDistrict(null);
        setHoveredDistrict(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDistrict, setSelectedDistrict]);

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

  // Normalize district names for comparison (same as page component)
  const normalizeDistrictName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  // Memoize the normalized selected district name for performance
  const normalizedSelectedDistrict = useMemo(() => {
    return selectedDistrict ? normalizeDistrictName(selectedDistrict) : null;
  }, [selectedDistrict]);
  
  // Check if a district is selected (with normalized comparison)
  const isDistrictSelected = (districtName: string): boolean => {
    if (!selectedDistrict || !normalizedSelectedDistrict) return false;
    
    // Direct match first (fastest)
    if (selectedDistrict === districtName) return true;
    
    // Normalized comparison
    const normalizedDistrict = normalizeDistrictName(districtName);
    
    // Exact normalized match
    if (normalizedSelectedDistrict === normalizedDistrict) return true;
    
    // STRICT: Only exact match - NO substring matching
    // This prevents "Agra" from matching "Prayagraj" or "Rampur" from matching "Balrampur"
    return false;
  };

  // Load sub-district geo data for rendering tehsil/taluk boundaries
  const { data: subDistrictGeoData } = useSubDistrictGeoData(stateCode);

  const mapData = useMemo(() => {
    if (!geoData || !geoData.features?.length) {
      return { paths: [], viewBox: "0 0 900 800", projection: null };
    }

    const width = 900;
    const height = 800;
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
      centroid: pathGenerator.centroid(feature as unknown as d3.GeoPermissibleObjects),
      name: normalizeGeoDistrictName(feature.properties.district || "Unknown", stateCode),
      originalId: feature.properties.dt_code || "",
    }));

    return { paths, viewBox: `0 0 ${width} ${height}`, projection };
  }, [geoData, stateCode]);

  // Compute OVERLAY tehsil paths using the district map projection
  const overlaySubDistrictData = useMemo(() => {
    if (!subDistrictGeoData || !selectedDistrict || !mapData.projection) {
      return { paths: [], hasData: false };
    }

    // Find the EXACT GeoJSON district name that matches selectedDistrict
    // selectedDistrict might be from API, so we need to find the corresponding GeoJSON district name
    // STRICT: Only exact normalized match - no substring matching
    let geoJsonDistrictName = selectedDistrict.toLowerCase().trim();
    
    // Try to find matching district name from the state GeoJSON using EXACT match only
    if (geoData && geoData.features) {
      const normalizedSelected = normalizeDistrictName(selectedDistrict);
      console.log('[StateMap] Looking for GeoJSON match for:', selectedDistrict, 'normalized:', normalizedSelected);
      
      // Find EXACT match only - no substring, no includes()
      const matchingGeoFeature = geoData.features.find(feature => {
        const geoDistrictName = normalizeGeoDistrictName(feature.properties.district || "", stateCode);
        const normalizedGeo = normalizeDistrictName(geoDistrictName);
        const isExactMatch = normalizedGeo === normalizedSelected;
        if (isExactMatch) {
          console.log('[StateMap] Exact match found:', geoDistrictName, 'normalized:', normalizedGeo);
        }
        return isExactMatch;
      });
      
      if (matchingGeoFeature) {
        // Use the exact GeoJSON district name for filtering
        geoJsonDistrictName = (matchingGeoFeature.properties.district || "").toLowerCase().trim();
        console.log('[StateMap] Using GeoJSON name for filter:', geoJsonDistrictName);
      } else {
        console.log('[StateMap] No exact GeoJSON match found for:', selectedDistrict, 'normalized:', normalizedSelected);
        console.log('[StateMap] Available GeoJSON districts:', geoData.features.slice(0, 5).map(f => ({
          original: f.properties.district,
          normalized: normalizeDistrictName(normalizeGeoDistrictName(f.properties.district || "", stateCode))
        })));
      }
    }
    
    console.log('[StateMap overlaySubDistrictData] Final filter name:', geoJsonDistrictName);
    const filteredFeatures = filterSubDistrictsByDistrict(subDistrictGeoData, geoJsonDistrictName);

    if (filteredFeatures.length === 0) {
      return { paths: [], hasData: false };
    }

    // Use the SAME projection as the district map
    const pathGenerator = d3.geoPath().projection(mapData.projection);

    const paths = filteredFeatures
      .map((feature, idx) => {
        // Ensure feature has valid geometry
        if (!feature.geometry || (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon")) {
          return null;
        }

        const pathString = pathGenerator(feature as unknown as d3.GeoPermissibleObjects);
        const centroid = pathGenerator.centroid(feature as unknown as d3.GeoPermissibleObjects);
        
        // Only include paths that have valid geometry
        if (!pathString || pathString.length === 0 || pathString === "M0,0" || pathString === "MNaN,NaNLNaN,NaN") {
          return null;
        }
        
        // Check if centroid is valid
        if (!centroid || !isFinite(centroid[0]) || !isFinite(centroid[1])) {
          return null;
        }
        
        return {
          d: pathString,
          centroid,
      name: feature.properties.sdtname || "Unknown",
      district: feature.properties.dtname || "",
      id: feature.id || idx,
        };
      })
      .filter((path): path is NonNullable<typeof path> => path !== null);

    return { paths, hasData: paths.length > 0 };
  }, [subDistrictGeoData, selectedDistrict, mapData.projection, geoData, stateCode]);

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
      {/* Show State-Level District Map */}
        <svg
          ref={svgRef}
          viewBox={mapData.viewBox}
          className="w-full h-auto drop-shadow-xl"
          style={{ maxHeight: "900px" }}
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

          {mapData.paths.map((district, idx) => {
            const isHovered = hoveredDistrict === district.name;
            // Use normalized comparison to check if this district is selected
            const isSelected = isDistrictSelected(district.name);
            const hasActiveDistrict = selectedDistrict !== null;
            
            // Force re-render when selectedDistrict changes by using it in the key
            const pathKey = `${district.name}-${selectedDistrict || 'none'}`;

            return (
              <motion.path
                key={pathKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.01 }}
                d={district.d}
                stroke={isSelected ? "var(--accent-primary)" : "var(--map-border-color)"}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : hasActiveDistrict && !isSelected ? 0.5 : 1}
                strokeOpacity={hasActiveDistrict && !isSelected ? 0.3 : 1}
                fill={
                  isSelected
                    ? "var(--accent-primary)"
                    : isHovered
                      ? "var(--accent-secondary)"
                      : "var(--accent-primary)"
                }
                style={{
                  filter: isSelected
                    ? "url(#selectedGlow)"
                    : isHovered
                      ? "url(#glow)"
                      : "none",
                  fillOpacity: isSelected
                    ? 0.6  // Selected district: normal opacity
                    : isHovered
                    ? 0.7
                    : hasActiveDistrict
                        ? 0.2  // Other districts when one is selected: washed out
                        : 0.6   // Normal state: normal opacity
                }}
                onMouseEnter={() => setHoveredDistrict(district.name)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onClick={() => {
                  // Use normalized comparison to check if already selected
                  const currentlySelected = isDistrictSelected(district.name);
                  
                  if (currentlySelected) {
                    // Deselect
                    if (onDistrictSelect) {
                      onDistrictSelect(null);
                    } else {
                      setSelectedDistrict(null);
                    }
                  } else {
                    // Select - call the callback first so it can normalize the name
                    if (onDistrictClick) {
                      onDistrictClick(district.name);
                    } else {
                      setSelectedDistrict(district.name);
                    }
                  }
                }}
              />
            );
          })}

          {/* Overlay tehsils when district is selected - thinner boundaries than districts */}
          {selectedDistrict && overlaySubDistrictData.hasData && overlaySubDistrictData.paths.map((subDistrict, idx) => {
            const isHovered = hoveredSubDistrict === subDistrict.name;

            return (
              <motion.path
                key={`overlay-sd-${subDistrict.id}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01, duration: 0.2 }}
                d={subDistrict.d}
                stroke="var(--map-border-color)"
                strokeWidth={isHovered ? 1.2 : 0.75}
                strokeOpacity={isHovered ? 0.9 : 0.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
                className="cursor-pointer transition-all duration-150"
                style={{
                  filter: isHovered ? "url(#glow)" : "none"
                }}
                onMouseEnter={() => setHoveredSubDistrict(subDistrict.name)}
                onMouseLeave={() => setHoveredSubDistrict(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSubDistrictClick) {
                    onSubDistrictClick({ name: subDistrict.name, district: subDistrict.district });
                  }
                }}
              />
            );
          })}

          {/* Overlay tehsils when district is selected - just boundaries, no fill */}
          {selectedDistrict && overlaySubDistrictData.hasData && overlaySubDistrictData.paths.map((subDistrict, idx) => {
            const isHovered = hoveredSubDistrict === subDistrict.name;

            return (
              <motion.path
                key={`overlay-sd-${subDistrict.id}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01, duration: 0.2 }}
                d={subDistrict.d}
                stroke="var(--map-border-color)"
                strokeWidth={isHovered ? 2 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
                fillOpacity={0}
                className="cursor-pointer transition-all duration-150"
                style={{
                  filter: isHovered ? "url(#glow)" : "none"
                }}
                onMouseEnter={() => setHoveredSubDistrict(subDistrict.name)}
                onMouseLeave={() => setHoveredSubDistrict(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSubDistrictClick) {
                    onSubDistrictClick({ name: subDistrict.name, district: subDistrict.district });
                  }
                }}
              />
            );
          })}
        </svg>

      {/* Floating Tooltip for Districts */}
      {hoveredName && !hoveredSubDistrict && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-bg-card px-3 py-2 text-sm font-semibold text-text-primary shadow-lg ring-1 ring-border-light backdrop-blur-md"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 12,
          }}
        >
          {hoveredName}
          {selectedDistrict !== hoveredName && (
            <span className="ml-2 text-xs text-text-muted">(click to see tehsils)</span>
          )}
        </div>
      )}

      {/* Floating Tooltip for Sub-Districts */}
      {hoveredSubDistrict && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-accent-primary px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 12,
          }}
        >
          <span className="text-[10px] uppercase tracking-wider opacity-70 block">Tehsil</span>
          {hoveredSubDistrict}
        </div>
      )}

    </div>
  );
}