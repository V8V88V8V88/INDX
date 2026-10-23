"use client";

import { useState, useMemo, useEffect, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as d3 from "d3";
import { useSubDistrictGeoData, filterSubDistrictsByDistrict } from "@/hooks/useSubDistrictGeoData";
import { EDGE_FADE_STYLE } from "@/lib/map-projection";
import { Button, CursorTooltip, Icon, Spinner } from "./ui";

interface StateMapProps {
  stateCode: string;
  selectedDistrict?: string | null;
  onDistrictSelect?: (district: string | null) => void;
  onDistrictClick?: (district: string) => void;
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

interface LabelSource {
  name: string;
  centroid: [number, number];
  bounds: [[number, number], [number, number]];
}

interface PlacedLabel {
  name: string;
  lines: string[];
  x: number;
  y: number;
  size: number;
}

const CHAR_WIDTH = 0.58;
const LINE_HEIGHT = 1.1;

function labelLines(name: string, size: number, maxWidth: number): string[] {
  const words = name.split(" ");
  if (words.length < 2 || name.length * size * CHAR_WIDTH <= maxWidth) return [name];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function placeLabels(districts: LabelSource[], baseSize: number): PlacedLabel[] {
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const overlaps = (b: (typeof placed)[number]) =>
    placed.some((p) => b.x0 < p.x1 && b.x1 > p.x0 && b.y0 < p.y1 && b.y1 > p.y0);

  const byArea = [...districts].sort(
    (a, b) =>
      (a.bounds[1][0] - a.bounds[0][0]) * (a.bounds[1][1] - a.bounds[0][1]) -
      (b.bounds[1][0] - b.bounds[0][0]) * (b.bounds[1][1] - b.bounds[0][1]),
  );

  return byArea.map((d) => {
    const [[bx0, by0], [bx1, by1]] = d.bounds;
    const [cx, cy] = d.centroid;
    let fallback: PlacedLabel | null = null;

    for (const size of [baseSize, baseSize * 0.82]) {
      const lines = labelLines(d.name, size, bx1 - bx0);
      const w = Math.max(...lines.map((l) => l.length)) * size * CHAR_WIDTH;
      const h = lines.length * size * LINE_HEIGHT;
      for (const step of [0, -1, 1, -2, 2, -3, 3]) {
        const y = cy + step * size * LINE_HEIGHT;
        if (step !== 0 && (y < by0 || y > by1)) continue;
        const box = { x0: cx - w / 2, y0: y - h / 2, x1: cx + w / 2, y1: y + h / 2 };
        const label = { name: d.name, lines, x: cx, y, size };
        fallback ??= label;
        if (!overlaps(box)) {
          placed.push(box);
          return label;
        }
      }
    }

    return fallback!;
  });
}

type Box = [number, number, number, number];

const MAX_DISTRICT_ZOOM = 2.2;

function zoomBox([x, y, w, h]: Box, [[x0, y0], [x1, y1]]: [[number, number], [number, number]]): Box {
  const k = Math.max(1, Math.min(MAX_DISTRICT_ZOOM, w / ((x1 - x0) * 3), h / ((y1 - y0) * 3)));
  const zw = w / k;
  const zh = h / k;
  const cx = Math.min(Math.max((x0 + x1) / 2, x + zw / 2), x + w - zw / 2);
  const cy = Math.min(Math.max((y0 + y1) / 2, y + zh / 2), y + h - zh / 2);
  return [cx - zw / 2, cy - zh / 2, zw, zh];
}

function rewindForD3<T extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>(feature: T): T {
  if (d3.geoArea(feature) <= 2 * Math.PI) return feature;
  const geometry = feature.geometry;
  const reverse = (rings: GeoJSON.Position[][]) => rings.map((ring) => [...ring].reverse());
  return {
    ...feature,
    geometry:
      geometry.type === "Polygon"
        ? { ...geometry, coordinates: reverse(geometry.coordinates) }
        : { ...geometry, coordinates: geometry.coordinates.map(reverse) },
  };
}

export function StateMap({ stateCode, selectedDistrict: externalSelectedDistrict, onDistrictSelect, onDistrictClick, onSubDistrictClick }: StateMapProps) {
  const [loaded, setLoaded] = useState<{ code: string; data: DistrictGeoData | null } | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredSubDistrict, setHoveredSubDistrict] = useState<string | null>(null);
  const [internalSelectedDistrict, setInternalSelectedDistrict] = useState<string | null>(null);
  const [prevStateCode, setPrevStateCode] = useState(stateCode);

  const loading = loaded?.code !== stateCode;
  const geoData = loading ? null : loaded.data;

  if (stateCode !== prevStateCode) {
    setPrevStateCode(stateCode);
    setHoveredDistrict(null);
    setHoveredSubDistrict(null);
    setInternalSelectedDistrict(null);
  }

  const selectedDistrict = externalSelectedDistrict !== undefined ? externalSelectedDistrict : internalSelectedDistrict;
  const [prevSelectedDistrict, setPrevSelectedDistrict] = useState(selectedDistrict);

  if (selectedDistrict !== prevSelectedDistrict) {
    setPrevSelectedDistrict(selectedDistrict);
    setHoveredSubDistrict(null);
  }
  const setSelectedDistrict = onDistrictSelect || setInternalSelectedDistrict;

  useEffect(() => {
    let cancelled = false;
    fetch(`/geo/states/${stateCode}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setLoaded({ code: stateCode, data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ code: stateCode, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

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
      return { paths: [], viewBox: "0 0 900 800", box: [0, 0, 900, 800] as Box, projection: null };
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
      bounds: pathGenerator.bounds(feature as unknown as d3.GeoPermissibleObjects),
    }));

    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(featureCollection as unknown as d3.GeoPermissibleObjects);
    const box: Box = [x0 - padding, y0 - padding, x1 - x0 + padding * 2, y1 - y0 + padding * 2];

    return { paths, viewBox: box.join(" "), box, projection };
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
      
      // Find EXACT match only - no substring, no includes()
      const matchingGeoFeature = geoData.features.find(feature => {
        const geoDistrictName = normalizeGeoDistrictName(feature.properties.district || "", stateCode);
        const normalizedGeo = normalizeDistrictName(geoDistrictName);
        return normalizedGeo === normalizedSelected;
      });
      
      if (matchingGeoFeature) {
        // Use the exact GeoJSON district name for filtering
        geoJsonDistrictName = (matchingGeoFeature.properties.district || "").toLowerCase().trim();
      }
    }
    
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

        const shape = rewindForD3(feature as unknown as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
        const pathString = pathGenerator(shape);
        const centroid = pathGenerator.centroid(shape);
        
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
  const mouseRafRef = useRef<number | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });
  const filterId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => () => {
    if (mouseRafRef.current) cancelAnimationFrame(mouseRafRef.current);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    latestMouseRef.current = { x: e.clientX, y: e.clientY };
    if (mouseRafRef.current) return;
    mouseRafRef.current = requestAnimationFrame(() => {
      mouseRafRef.current = null;
      setMousePos(latestMouseRef.current);
    });
  };

  const toggleDistrict = (name: string) => {
    if (isDistrictSelected(name)) {
      setSelectedDistrict(null);
    } else if (onDistrictClick) {
      onDistrictClick(name);
    } else {
      setSelectedDistrict(name);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[320px] w-full items-center lg:h-[600px] justify-center rounded-2xl bg-bg-secondary/50">
        <Spinner label="Loading map" />
      </div>
    );
  }

  if (!geoData || mapData.paths.length === 0) {
    return (
      <div className="flex h-[320px] w-full items-center lg:h-[600px] justify-center rounded-2xl bg-bg-secondary/50 text-text-muted">
        District boundaries not available
      </div>
    );
  }

  const selectedPath = selectedDistrict ? mapData.paths.find((p) => isDistrictSelected(p.name)) : undefined;
  const zoomed = selectedPath ? zoomBox(mapData.box, selectedPath.bounds) : mapData.box;
  const zoomedViewBox = zoomed.join(" ");
  const isZoomedIn = zoomed[2] < mapData.box[2] * 0.95;
  const labelSize = zoomed[2] / 68;
  const labels = showLabels ? placeLabels(mapData.paths, labelSize) : [];

  return (
    <div className="relative w-full" style={{ overflow: "visible" }}>
      {/* Show State-Level District Map */}
        <motion.svg
          viewBox={mapData.viewBox}
          initial={false}
          animate={{ viewBox: zoomedViewBox }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="block h-auto max-h-[460px] w-full drop-shadow-xl lg:max-h-[760px]"
          style={isZoomedIn ? EDGE_FADE_STYLE : undefined}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          role="group"
          aria-label="District map"
        >
          <filter id={`${filterId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`${filterId}-selected-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <g aria-hidden="true">
            {mapData.paths.map((district) => (
              <path
                key={district.name}
                d={district.d}
                fill="none"
                stroke="var(--map-outline)"
                strokeWidth={4}
                strokeOpacity={0.75}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {mapData.paths.map((district) => (
              <path key={district.name} d={district.d} fill="var(--bg-primary)" />
            ))}
          </g>

          {mapData.paths.map((district, idx) => {
            const isHovered = hoveredDistrict === district.name;
            // Use normalized comparison to check if this district is selected
            const isSelected = isDistrictSelected(district.name);
            const hasActiveDistrict = selectedDistrict !== null;

            return (
              <motion.path
                key={district.name}
                role="button"
                tabIndex={0}
                aria-label={district.name}
                aria-pressed={isSelected}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.01 }}
                d={district.d}
                stroke="var(--map-district-line)"
                strokeWidth={isSelected ? 2 : isHovered ? 1.5 : hasActiveDistrict ? 0.4 : 0.6}
                strokeOpacity={isSelected || isHovered ? 1 : hasActiveDistrict ? 0.25 : 0.6}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  fill: isSelected || isHovered ? "var(--map-district-fill-active)" : "var(--map-district-fill)",
                  filter: isSelected
                    ? `url(#${filterId}-selected-glow)`
                    : isHovered
                      ? `url(#${filterId}-glow)`
                      : "none",
                  fillOpacity: isSelected
                    ? 1
                    : isHovered
                    ? 1
                    : hasActiveDistrict
                        ? 0.4
                        : 1
                }}
                onMouseEnter={() => setHoveredDistrict(district.name)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onClick={() => toggleDistrict(district.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDistrict(district.name);
                  }
                }}
              />
            );
          })}

          {/* Overlay tehsils when district is selected */}
          {selectedDistrict && overlaySubDistrictData.hasData && overlaySubDistrictData.paths.map((subDistrict, idx) => {
            const isHovered = hoveredSubDistrict === subDistrict.name;

            return (
              <motion.path
                key={`overlay-sd-${subDistrict.id}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01, duration: 0.2 }}
                d={subDistrict.d}
                stroke="var(--map-district-line)"
                strokeWidth={isHovered ? 1.8 : 1}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill={isHovered ? "var(--map-district-line)" : "transparent"}
                fillOpacity={isHovered ? 0.25 : 0}
                className="cursor-pointer transition-all duration-150"
                style={{
                  filter: isHovered ? `url(#${filterId}-glow)` : "none"
                }}
                onMouseEnter={() => setHoveredSubDistrict(subDistrict.name)}
                onMouseLeave={() => setHoveredSubDistrict(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSubDistrictClick) {
                    onSubDistrictClick({ name: subDistrict.name, district: subDistrict.district });
                  } else {
                    toggleDistrict(selectedDistrict);
                  }
                }}
              />
            );
          })}
          {showLabels && (
            <g aria-hidden="true" pointerEvents="none" fontSize={labelSize} fontWeight={600} textAnchor="middle" dominantBaseline="central">
              {labels.map((label) => (
                <text
                  key={label.name}
                  x={label.x}
                  y={label.y}
                  fontSize={label.size}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={label.size * 0.22}
                  strokeOpacity={0.45}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {label.lines.map((line, i) => (
                    <tspan key={line} x={label.x} dy={i === 0 ? `${-(label.lines.length - 1) * 0.55}em` : "1.1em"}>
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}
            </g>
          )}
        </motion.svg>

      {isZoomedIn && (
        <Button
          variant="overlay"
          size="sm"
          iconOnly
          onClick={() => setSelectedDistrict(null)}
          title="Back to full map"
          aria-label="Zoom out to full map"
          className="absolute left-0 top-0"
        >
          <Icon name="arrow-left" size={14} />
        </Button>
      )}

      <Button
        variant="overlay"
        size="sm"
        iconOnly
        pressed={showLabels}
        onClick={() => setShowLabels((v) => !v)}
        title="Toggle district names"
        aria-label="Show district names"
        className="absolute right-0 top-0"
      >
        <Icon name="tag" size={14} />
      </Button>

      {hoveredDistrict && !hoveredSubDistrict && (
        <CursorTooltip x={mousePos.x} y={mousePos.y}>
          {hoveredDistrict}
        </CursorTooltip>
      )}

      {hoveredSubDistrict && (
        <CursorTooltip x={mousePos.x} y={mousePos.y}>
          <span className="block text-[10px] uppercase tracking-wider opacity-60">Tehsil</span>
          {hoveredSubDistrict}
        </CursorTooltip>
      )}
    </div>
  );
}