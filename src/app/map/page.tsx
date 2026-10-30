"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components";
import { Button, CursorTooltip, Icon, Spinner } from "@/components/ui";
import { states } from "@/data/india";
import { stateNameToCode } from "@/lib/map-projection";
import { createStateMetricColorScale, isMapMetric, type MapMetric } from "@/lib/map-view";
import { METRICS } from "@/lib/metrics";

const INDIA_CENTER: [number, number] = [82, 22];
const INDIA_BOUNDS: [[number, number], [number, number]] = [[68, 6], [98, 38]];
const DEFAULT_ZOOM = 4;
const DISTRICT_MIN_ZOOM = 5.5;
const DISTRICT_LABELS_MIN_ZOOM = 6.0;
const STATE_LABELS_MAX_ZOOM = 7;
const HOVER_OPACITY: maplibregl.ExpressionSpecification = ["case", ["boolean", ["feature-state", "hover"], false], 1, 0];
const SHORT_STATE_LABELS: Record<string, string> = {
  "Dadra and Nagar Haveli and Daman and Diu": "DNH & DD",
  "Andaman & Nicobar": "A & N Islands",
};
const SKIP_DISTRICT_LABELS = new Set(["DL", "CH", "PY", "DD", "LD", "AN"]);
const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";
const GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const LABEL_FONT_BOLD = "Noto Sans Bold";
const BASEMAP_ATTRIBUTION =
  'Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function resolveCSS(cssValue: string): string {
  const el = document.createElement("span");
  el.style.display = "none";
  el.style.color = cssValue;
  document.body.appendChild(el);
  const raw = getComputedStyle(el).color;
  el.remove();

  const srgb = raw.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) {
    const toHex = (v: string) => Math.round(parseFloat(v) * 255).toString(16).padStart(2, "0");
    return `#${toHex(srgb[1])}${toHex(srgb[2])}${toHex(srgb[3])}`;
  }

  const rgb = raw.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (rgb) {
    const toHex = (v: string) => Math.round(parseFloat(v)).toString(16).padStart(2, "0");
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }

  return raw;
}

function tc() {
  const dark = isDark();
  return {
    bg: resolveCSS("var(--bg-primary)"),
    border: resolveCSS("var(--map-district-line)"),
    outline: resolveCSS("var(--map-outline)"),
    labelText: dark ? "#ffffff" : "#09090b",
    districtHalo: dark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
    accent: resolveCSS("var(--accent-primary)"),
    terrain: [
      "color-mix(in srgb, var(--accent-primary) 40%, #000000)",
      "color-mix(in srgb, var(--accent-primary) 62%, #000000)",
      "color-mix(in srgb, var(--accent-primary) 82%, #000000)",
      "var(--accent-primary)",
      "color-mix(in srgb, var(--accent-primary) 85%, #ffffff)",
    ].map(resolveCSS),
  };
}

const STATE_ELEVATION: Record<string, number> = {
  LA: 4500, // Ladakh
  SK: 3200, // Sikkim
  HP: 2800, // Himachal Pradesh
  UK: 2500, // Uttarakhand
  AR: 2200, // Arunachal Pradesh
  JK: 2100, // Jammu & Kashmir
  ML: 1400, // Meghalaya
  NL: 1300, // Nagaland
  MN: 1100, // Manipur
  MZ: 1000, // Mizoram
  KL: 850,  // Kerala (Anamudi / Western Ghats)
  KA: 700,  // Karnataka (Western Ghats & Deccan Plateau)
  TN: 650,  // Tamil Nadu (Nilgiris)
  MH: 600,  // Maharashtra (Sahyadris & Deccan Plateau)
  MP: 550,  // Madhya Pradesh (Vindhyas, Satpura, Malwa)
  CG: 480,  // Chhattisgarh (Bastar Plateau, Maikal)
  JH: 450,  // Jharkhand (Chota Nagpur Plateau)
  TG: 430,  // Telangana (Telangana Plateau)
  TR: 380,  // Tripura (Jampui Hills)
  OR: 350,  // Odisha (Eastern Ghats)
  AP: 320,  // Andhra Pradesh
  CH: 320,  // Chandigarh (Shivaliks)
  RJ: 300,  // Rajasthan (Aravalli & Thar)
  AS: 250,  // Assam (Valley & Karbi Hills)
  HR: 230,  // Haryana (Plains)
  PB: 220,  // Punjab (Plains)
  DL: 215,  // Delhi (Ridge & Yamuna)
  GA: 180,  // Goa (Konkan coast & slope)
  UP: 140,  // Uttar Pradesh (Gangetic plain)
  BR: 100,  // Bihar (Gangetic plain)
  AN: 100,  // Andaman & Nicobar (Islands)
  WB: 80,   // West Bengal (Delta & plains)
  GJ: 75,   // Gujarat (Coastal & Kathiawar)
  PY: 15,   // Puducherry (Coastal)
  DD: 10,   // Daman & Diu (Coastal)
  LD: 5,    // Lakshadweep (Atolls)
};

const codeToName = Object.fromEntries(
  Object.entries(stateNameToCode).map(([name, code]) => [code, name]),
);

const TERRAIN_STOPS = [50, 250, 700, 1800, 4500];

function terrainElevationExpr(colors: string[]): maplibregl.ExpressionSpecification {
  const elevation: unknown[] = ["match", ["get", "ST_NM"]];
  for (const [code, metres] of Object.entries(STATE_ELEVATION)) {
    const name = codeToName[code];
    if (name) elevation.push(name, metres);
  }
  elevation.push(200);

  return ["interpolate", ["linear"], elevation, ...TERRAIN_STOPS.flatMap((stop, i) => [stop, colors[i]])] as maplibregl.ExpressionSpecification;
}

function mainlandCentroid(geom: GeoJSON.Geometry | null): [number, number] {
  let ring: GeoJSON.Position[];
  if (geom?.type === "Polygon") {
    ring = geom.coordinates[0];
  } else if (geom?.type === "MultiPolygon") {
    ring = geom.coordinates[0][0];
    for (const poly of geom.coordinates) {
      if (poly[0].length > ring.length) ring = poly[0];
    }
  } else {
    return INDIA_CENTER;
  }
  let sx = 0, sy = 0;
  for (const c of ring) { sx += c[0]; sy += c[1]; }
  return [sx / ring.length, sy / ring.length];
}

function addDistrictLayers(m: maplibregl.Map, code: string, data: GeoJSON.FeatureCollection, showLabels: boolean) {
  const c = tc();
  const src = `d-${code}`;

  m.addSource(src, { type: "geojson", data, promoteId: "district" });
  m.addLayer(
    { id: `d-fill-${code}`, type: "fill", source: src, paint: { "fill-color": "#000", "fill-opacity": 0.01 } },
    "state-line",
  );
  m.addLayer(
    {
      id: `d-line-${code}`,
      type: "line",
      source: src,
      paint: {
        "line-color": c.border,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 8, 0.6, 12, 1],
        "line-opacity": 0.3,
      },
      layout: { "line-join": "round" },
    },
    "state-line",
  );
  m.addLayer(
    {
      id: `d-hover-${code}`,
      type: "line",
      source: src,
      layout: { "line-join": "round" },
      paint: {
        "line-color": c.border,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.5, 8, 2.2, 12, 3],
        "line-opacity": HOVER_OPACITY,
      },
    },
    "state-labels",
  );

  if (SKIP_DISTRICT_LABELS.has(code)) return;

  const labelSrc = `dl-${code}`;
  m.addSource(labelSrc, { type: "geojson", data: centroidPoints(data, (props) => props) });
  m.addLayer(
    {
      id: `d-label-${code}`,
      type: "symbol",
      source: labelSrc,
      layout: {
        "text-field": ["get", "district"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 8, 13, 10, 15, 12, 17],
        "text-font": [LABEL_FONT_BOLD],
        "text-allow-overlap": false,
        "text-optional": true,
        "text-padding": 5,
        visibility: showLabels ? "visible" : "none",
      },
      paint: {
        "text-color": c.labelText,
        "text-halo-color": c.districtHalo,
        "text-halo-width": 1.3,
        "text-halo-blur": 0.8,
      },
      minzoom: DISTRICT_LABELS_MIN_ZOOM,
    },
    "state-labels",
  );
}

function readInitialView() {
  const p = new URLSearchParams(window.location.search);
  const lng = parseFloat(p.get("lng") || "");
  const lat = parseFloat(p.get("lat") || "");
  const z = parseFloat(p.get("z") || "");
  const hasPosition = isFinite(lng) && isFinite(lat) && isFinite(z) && z > 4.3;
  return {
    center: hasPosition ? ([lng, lat] as [number, number]) : null,
    zoom: hasPosition ? Math.max(3, Math.min(14, z)) : null,
    showLabels: p.get("labels") !== "0",
    fill: (isMapMetric(p.get("m")) ? p.get("m") : "terrain") as FillMode,
  };
}

function basemapSource(dark: boolean): maplibregl.RasterSourceSpecification {
  return {
    type: "raster",
    tiles: [
      dark
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 16,
    attribution: BASEMAP_ATTRIBUTION,
  };
}

function hillshadePaint(dark: boolean) {
  return {
    "raster-opacity": dark ? 0.3 : 0.07,
    "raster-contrast": 0.6,
    "raster-brightness-max": 0.85,
  };
}

function hillshadeTiles(dark: boolean) {
  return [
    dark
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade_Dark/MapServer/tile/{z}/{y}/{x}"
      : "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
  ];
}

function hillshadeSource(dark: boolean): maplibregl.RasterSourceSpecification {
  return {
    type: "raster",
    tiles: hillshadeTiles(dark),
    tileSize: 256,
    maxzoom: 16,
    attribution: "Esri, USGS, NGA, NASA, CGIAR",
  };
}

type FillMode = MapMetric | "terrain";

const fillOptions: { value: FillMode; label: string }[] = [
  { value: "terrain", label: "Terrain" },
  ...METRICS.map((m) => ({ value: m.key, label: m.label })),
];

function stateFillExpr(mode: FillMode, terrain: string[]): maplibregl.ExpressionSpecification {
  if (mode === "terrain") return terrainElevationExpr(terrain);
  const scale = createStateMetricColorScale(mode);
  const expr: unknown[] = ["match", ["get", "ST_NM"]];
  const seen = new Set<string>();
  for (const state of states) {
    const name = codeToName[state.id];
    if (!name || seen.has(name)) continue;
    seen.add(name);
    expr.push(name, resolveCSS(scale(state[mode], state.id)));
  }
  expr.push(resolveCSS("var(--accent-primary)"));
  return expr as maplibregl.ExpressionSpecification;
}

function centroidPoints(geo: GeoJSON.FeatureCollection, pickProps: (props: GeoJSON.GeoJsonProperties) => GeoJSON.GeoJsonProperties): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: geo.features.map((f) => ({
      type: "Feature",
      properties: pickProps(f.properties),
      geometry: { type: "Point", coordinates: mainlandCentroid(f.geometry) },
    })),
  };
}

const zoomButtonClass = "flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary";

export default function MapPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(new Set<string>());
  const labelsRef = useRef(true);
  const fillRef = useRef<FillMode>("terrain");
  const [fill, setFill] = useState<FillMode>("terrain");
  const [fillOpen, setFillOpen] = useState(false);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [basemap, setBasemap] = useState(false);
  const [hovered, setHovered] = useState<{ name: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [baseZoom, setBaseZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // ---- map creation ----
  useEffect(() => {
    if (!containerRef.current) return;
    let dead = false;
    let map: maplibregl.Map | null = null;
    const loaded = loadedRef.current;
    let hoverRaf: number | null = null;
    let themeObserver: MutationObserver | null = null;
    let hoverTarget: { source: string; id: string | number } | null = null;

    const setHoverTarget = (next: typeof hoverTarget) => {
      if (!map || (next?.source === hoverTarget?.source && next?.id === hoverTarget?.id)) return;
      if (hoverTarget && map.getSource(hoverTarget.source)) map.setFeatureState(hoverTarget, { hover: false });
      if (next) map.setFeatureState(next, { hover: true });
      hoverTarget = next;
    };

    const initial = readInitialView();
    labelsRef.current = initial.showLabels;
    fillRef.current = initial.fill;
    setFill(initial.fill);
    let lastDark = isDark();

    const loadVisibleDistricts = () => {
      if (!map || map.getZoom() < DISTRICT_MIN_ZOOM || !map.getSource("states")) return;
      const need = new Set<string>();
      for (const f of map.queryRenderedFeatures({ layers: ["state-fill"] })) {
        const code = stateNameToCode[f.properties?.ST_NM];
        if (code && !loadedRef.current.has(code)) need.add(code);
      }

      need.forEach((code) => {
        loadedRef.current.add(code);
        fetch(`/geo/states/${code}.json`)
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json() as Promise<GeoJSON.FeatureCollection>;
          })
          .then((data) => {
            const m = mapRef.current;
            if (dead || !m || m.getSource(`d-${code}`)) return;
            addDistrictLayers(m, code, data, labelsRef.current);
          })
          .catch(() => {
            loadedRef.current.delete(code);
          });
      });
    };

    import("maplibre-gl")
      .then((maplibre) => {
        if (dead || !containerRef.current) return;

        const c = tc();
        setShowLabels(initial.showLabels);

        const mapOpts: maplibregl.MapOptions = {
          container: containerRef.current,
          style: {
            version: 8,
            glyphs: GLYPHS_URL,
            sources: {
              carto: basemapSource(lastDark),
              hillshade: hillshadeSource(lastDark),
            },
            layers: [
              { id: "bg", type: "background", paint: { "background-color": c.bg } },
              {
                id: "basemap",
                type: "raster",
                source: "carto",
                layout: { visibility: "none" },
                paint: { "raster-opacity": 0.45 },
              },
            ],
          },
          minZoom: 3,
          maxZoom: 14,
          attributionControl: false,
        };

        if (initial.center && initial.zoom) {
          mapOpts.center = initial.center;
          mapOpts.zoom = initial.zoom;
        } else {
          mapOpts.bounds = INDIA_BOUNDS;
          mapOpts.fitBoundsOptions = { padding: 30 };
        }

        maplibre.setWorkerUrl(MAP_WORKER_URL);
        map = new maplibre.Map(mapOpts);
        mapRef.current = map;
        const m = map;
        m.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-left");

        m.on("load", async () => {
          if (dead) return;
          m.resize();
          setBaseZoom(m.getZoom());

          let geo: GeoJSON.FeatureCollection;
          let maskGeo: GeoJSON.FeatureCollection;
          try {
            const [statesRes, maskRes] = await Promise.all([
              fetch("/india-states.json"),
              fetch("/india-mask.json"),
            ]);
            if (!statesRes.ok || !maskRes.ok) throw new Error("Failed to load map data");
            geo = await statesRes.json();
            maskGeo = await maskRes.json();
          } catch (err) {
            console.error("Failed to load map data", err);
            if (!dead) setLoadError(true);
            return;
          }
          if (dead) return;

          m.addSource("states", { type: "geojson", data: geo, promoteId: "ST_NM" });
          m.addSource("india-mask", { type: "geojson", data: maskGeo });
          m.addSource("state-centroids", {
            type: "geojson",
            data: centroidPoints(geo, (props) => ({ ST_NM: props?.ST_NM })),
          });

          // 1. Dynamic elevation fill for each state (solid base in active theme accent)
          m.addLayer({
            id: "state-fill",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": stateFillExpr(fillRef.current, c.terrain),
              "fill-opacity": 1.0,
            },
          });

          // 2. Real physical hillshade relief draped over the elevation-colored land
          m.addLayer({
            id: "hillshade",
            type: "raster",
            source: "hillshade",
            layout: { visibility: fillRef.current === "terrain" ? "visible" : "none" },
            paint: hillshadePaint(lastDark),
          });

          // 3. Country mask: completely covers outside countries/oceans with background color
          m.addLayer({
            id: "country-mask",
            type: "fill",
            source: "india-mask",
            paint: {
              "fill-color": c.bg,
              "fill-opacity": 1.0,
            },
          });

          // 4. State boundary line
          m.addLayer({
            id: "state-line",
            type: "line",
            source: "states",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": c.border,
              "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 1, 10, 1.8],
              "line-opacity": 0.6,
            },
          });

          m.addLayer({
            id: "country-outline",
            type: "line",
            source: "india-mask",
            layout: { "line-join": "round" },
            paint: {
              "line-color": c.outline,
              "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 6, 2.5, 10, 3.5],
              "line-opacity": 0.75,
            },
          });

          m.addLayer({
            id: "state-hover",
            type: "line",
            source: "states",
            layout: { "line-join": "round" },
            paint: {
              "line-color": c.border,
              "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 6, 2.2, 10, 3],
              "line-opacity": HOVER_OPACITY,
            },
          });

          m.addLayer({
            id: "state-labels",
            type: "symbol",
            source: "state-centroids",
            layout: {
              "text-field": ["match", ["get", "ST_NM"], ...Object.entries(SHORT_STATE_LABELS).flat(), ["get", "ST_NM"]] as unknown as maplibregl.ExpressionSpecification,
              "text-size": ["interpolate", ["linear"], ["zoom"], 3, 8.5, 5, 10.5, 7, 13],
              "text-font": [LABEL_FONT_BOLD],
              "text-letter-spacing": 0.02,
              "text-max-width": 10,
              "text-allow-overlap": false,
              "text-padding": 4,
              visibility: labelsRef.current ? "visible" : "none",
            },
            paint: {
              "text-color": c.labelText,
              "text-halo-color": c.districtHalo,
              "text-halo-width": 1.4,
              "text-halo-blur": 0.8,
            },
            maxzoom: STATE_LABELS_MAX_ZOOM,
          });

          setReady(true);
          setZoom(m.getZoom());
          m.once("idle", loadVisibleDistricts);
        });

        m.on("zoomend", () => setZoom(m.getZoom()));
        m.on("moveend", loadVisibleDistricts);

        m.on("mousemove", (e) => {
          const point = e.point;
          const { clientX, clientY } = e.originalEvent;
          if (hoverRaf) cancelAnimationFrame(hoverRaf);
          hoverRaf = requestAnimationFrame(() => {
            hoverRaf = null;
            if (dead || !m.getLayer("state-fill")) return;
            const features = m.queryRenderedFeatures(point);
            const district = features.find((f) => f.layer.id.startsWith("d-fill-"));
            const st = features.find((f) => f.layer.id === "state-fill");
            const name: string | null = district?.properties?.district || st?.properties?.ST_NM || null;
            const target = district ?? st;
            setHoverTarget(target?.id != null ? { source: target.source, id: target.id } : null);
            m.getCanvas().style.cursor = name ? "pointer" : "";
            setHovered(name ? { name, x: clientX, y: clientY } : null);
          });
        });
        m.on("mouseout", () => {
          setHoverTarget(null);
          setHovered(null);
        });

        m.on("click", (e) => {
          if (!m.getLayer("state-fill")) return;
          const features = m.queryRenderedFeatures(e.point);
          const district = features.find((f) => f.layer.id.startsWith("d-fill-"));
          const name: string | undefined = district?.properties?.district;
          if (district && name) {
            const code = district.layer.id.slice("d-fill-".length);
            routerRef.current.push(`/state/${code}#district-${encodeURIComponent(name)}`);
            return;
          }
          const code = stateNameToCode[features.find((f) => f.layer.id === "state-fill")?.properties?.ST_NM];
          if (code) routerRef.current.push(`/state/${code}`);
        });

        const restyle = () => {
          if (!m.getLayer("state-fill")) return;
          const colors = tc();
          const dark = isDark();

          m.setPaintProperty("bg", "background-color", colors.bg);
          m.setPaintProperty("state-fill", "fill-color", stateFillExpr(fillRef.current, colors.terrain));
          m.setPaintProperty("state-fill", "fill-opacity", 1.0);
          if (m.getLayer("hillshade")) {
            for (const [key, value] of Object.entries(hillshadePaint(dark))) {
              m.setPaintProperty("hillshade", key as "raster-opacity", value);
            }
          }
          if (m.getLayer("country-mask")) {
            m.setPaintProperty("country-mask", "fill-color", colors.bg);
          }
          m.setPaintProperty("state-line", "line-color", colors.border);
          m.setPaintProperty("state-hover", "line-color", colors.border);
          m.setPaintProperty("country-outline", "line-color", colors.outline);
          m.setPaintProperty("state-labels", "text-color", colors.labelText);
          m.setPaintProperty("state-labels", "text-halo-color", colors.districtHalo);

          loadedRef.current.forEach((code) => {
            if (m.getLayer(`d-line-${code}`)) m.setPaintProperty(`d-line-${code}`, "line-color", colors.border);
            if (m.getLayer(`d-hover-${code}`)) m.setPaintProperty(`d-hover-${code}`, "line-color", colors.border);
            if (m.getLayer(`d-label-${code}`)) {
              m.setPaintProperty(`d-label-${code}`, "text-color", colors.labelText);
              m.setPaintProperty(`d-label-${code}`, "text-halo-color", colors.districtHalo);
            }
          });

          if (dark !== lastDark) {
            lastDark = dark;
            (m.getSource("hillshade") as maplibregl.RasterTileSource | undefined)?.setTiles(hillshadeTiles(dark));
            const visibility = m.getLayoutProperty("basemap", "visibility");
            m.removeLayer("basemap");
            m.removeSource("carto");
            m.addSource("carto", basemapSource(dark));
            m.addLayer(
              { id: "basemap", type: "raster", source: "carto", layout: { visibility }, paint: { "raster-opacity": 0.45 } },
              "state-fill",
            );

          }
        };
        themeObserver = new MutationObserver(restyle);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
      })
      .catch((err) => {
        console.error("Failed to load the map library", err);
        if (!dead) setLoadError(true);
      });

    return () => {
      dead = true;
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      themeObserver?.disconnect();
      map?.remove();
      mapRef.current = null;
      loaded.clear();
    };
  }, []);

  // ---- controls ----
  const toggleLabels = () => {
    const next = !showLabels;
    setShowLabels(next);
    labelsRef.current = next;
    const m = mapRef.current;
    if (!m) return;
    const vis = next ? "visible" : "none";
    if (m.getLayer("state-labels")) m.setLayoutProperty("state-labels", "visibility", vis);
    loadedRef.current.forEach((code) => {
      if (m.getLayer(`d-label-${code}`)) m.setLayoutProperty(`d-label-${code}`, "visibility", vis);
    });
  };

  const toggleBasemap = () => {
    const next = !basemap;
    setBasemap(next);
    const m = mapRef.current;
    if (m?.getLayer("basemap")) m.setLayoutProperty("basemap", "visibility", next ? "visible" : "none");
    if (m?.getLayer("country-mask")) m.setPaintProperty("country-mask", "fill-opacity", next ? 0.25 : 1);
  };

  const chooseFill = (next: FillMode) => {
    setFillOpen(false);
    setFill(next);
    fillRef.current = next;
    const m = mapRef.current;
    if (m?.getLayer("state-fill")) m.setPaintProperty("state-fill", "fill-color", stateFillExpr(next, tc().terrain));
    if (m?.getLayer("hillshade")) m.setLayoutProperty("hillshade", "visibility", next === "terrain" ? "visible" : "none");
    const url = new URL(window.location.href);
    if (next === "terrain") url.searchParams.delete("m");
    else url.searchParams.set("m", next);
    window.history.replaceState(window.history.state, "", url);
  };

  const resetView = () => {
    mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: 30, duration: 500 });
  };

  const doZoomIn = () => mapRef.current?.zoomIn({ duration: 200 });
  const doZoomOut = () => mapRef.current?.zoomOut({ duration: 200 });

  const hasZoomed = Math.abs(zoom - baseZoom) > 0.1;

  return (
    <div className="relative h-screen overflow-hidden bg-bg-primary">
      <Header overlay breadcrumbs={[{ label: "Map", href: "/map" }]} />

      <main className="relative h-full">
        <div ref={containerRef} className="h-full w-full" role="region" aria-label="Map of India by state and district" />
        <div
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_40px_var(--map-vignette)]"
          aria-hidden="true"
        />

        {loadError ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-primary" role="alert">
            <p className="text-text-muted">Couldn&apos;t load the map. Please refresh to try again.</p>
          </div>
        ) : !ready && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-primary">
            <Spinner label="Loading map" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0">

          <div className="pointer-events-auto absolute right-4 top-16 z-10 flex flex-col items-end gap-2">
            <Button variant="overlay" iconOnly pressed={showLabels} onClick={toggleLabels} title="Toggle labels" aria-label="Show labels">
              <Icon name="tag" />
            </Button>
            <Button variant="overlay" iconOnly pressed={basemap} onClick={toggleBasemap} title="Toggle basemap" aria-label="Show basemap">
              <Icon name="globe" />
            </Button>
            <div className="relative">
              <Button
                variant="overlay"
                iconOnly
                pressed={fillOpen}
                onClick={() => setFillOpen((open) => !open)}
                title="Color map by"
                aria-label="Color map by"
                aria-expanded={fillOpen}
              >
                <Icon name="layers" />
              </Button>
              {fillOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setFillOpen(false)} aria-hidden="true" />
                  <div
                    role="menu"
                    aria-label="Color map by"
                    className="absolute right-full top-0 mr-2 w-40 overflow-hidden rounded-2xl border border-border-light bg-bg-card/95 p-1 shadow-lg backdrop-blur-md"
                  >
                    {fillOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={fill === option.value}
                        onClick={() => chooseFill(option.value)}
                        className={`block w-full rounded-xl px-3 py-1.5 text-left text-sm transition-colors ${
                          fill === option.value
                            ? "bg-accent-primary text-white"
                            : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
            {hasZoomed && (
              <Button variant="overlay" iconOnly onClick={resetView} title="Reset" aria-label="Reset view">
                <Icon name="reset" size={14} />
              </Button>
            )}
            <div className="flex flex-col overflow-hidden rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm">
              <button type="button" onClick={doZoomIn} className={`${zoomButtonClass} border-b border-border-light`} title="Zoom in" aria-label="Zoom in">
                <Icon name="plus" />
              </button>
              <button type="button" onClick={doZoomOut} className={zoomButtonClass} title="Zoom out" aria-label="Zoom out">
                <Icon name="minus" />
              </button>
            </div>
          </div>
        </div>

        {hovered && (
          <CursorTooltip x={hovered.x} y={hovered.y}>
            {hovered.name}
          </CursorTooltip>
        )}
      </main>
    </div>
  );
}
