"use client";

import { useEffect, useRef, useState } from "react";
import type * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components";
import { Button, CursorTooltip, Icon, LinkButton, Spinner } from "@/components/ui";
import { stateNameToCode } from "@/lib/map-projection";

const INDIA_CENTER: [number, number] = [82, 22];
const INDIA_BOUNDS: [[number, number], [number, number]] = [[68, 6], [98, 38]];
const DEFAULT_ZOOM = 4;
const DISTRICT_MIN_ZOOM = 5.5;
const DISTRICT_LABELS_MIN_ZOOM = 6.0;
const STATE_LABELS_MAX_ZOOM = 7;
const SKIP_DISTRICT_LABELS = new Set(["DL", "CH", "PY", "DD", "LD", "AN"]);
const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";
const GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const LABEL_FONT_BOLD = "Noto Sans Bold";
const BASEMAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

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
    text: resolveCSS("var(--text-primary)"),
    border: resolveCSS("var(--map-border-color)"),
    labelText: dark ? "#ffffff" : "#09090b",
    labelHalo: dark ? "#000000" : "#ffffff",
    districtHalo: dark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
    accent: resolveCSS("var(--accent-primary)"),
    choro: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => resolveCSS(`var(--choro-${i})`)),
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

function terrainElevationExpr(choro: string[]): unknown[] {
  const sorted = Object.entries(STATE_ELEVATION).sort((a, b) => b[1] - a[1]);
  const total = sorted.length;
  const expr: unknown[] = ["match", ["get", "ST_NM"]];

  // Use vibrant, fully-saturated palette stops (indices 3 to 8) to keep colors rich and eliminate dull gray
  const vibrant = [choro[3], choro[4], choro[5], choro[6], choro[7], choro[8]];

  sorted.forEach(([code], rank) => {
    const name = codeToName[code];
    if (!name) return;
    const ratio = rank / Math.max(total - 1, 1);
    const bucket = Math.min(Math.floor(ratio * vibrant.length), vibrant.length - 1);
    const colorIdx = vibrant.length - 1 - bucket;
    expr.push(name, vibrant[colorIdx]);
  });

  expr.push(vibrant[2]);
  return expr;
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

  m.addSource(src, { type: "geojson", data });
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
        "line-color": c.text,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 8, 0.7, 12, 1],
        "line-opacity": 0.35,
      },
    },
    "state-line",
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
        "text-halo-width": 1.6,
        "text-halo-blur": 0.6,
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
  };
}

function basemapSource(dark: boolean): maplibregl.RasterSourceSpecification {
  return {
    type: "raster",
    tiles: [
      dark
        ? "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"
        : "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
    ],
    tileSize: 256,
    attribution: BASEMAP_ATTRIBUTION,
  };
}

function hillshadeSource(dark: boolean): maplibregl.RasterSourceSpecification {
  return {
    type: "raster",
    tiles: [
      dark
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade_Dark/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 16,
    attribution: "Esri, USGS, NGA, NASA, CGIAR",
  };
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

const pillClass = "rounded-full border border-border-light bg-bg-card/90 px-3 py-1.5 text-xs text-text-muted backdrop-blur-sm";
const zoomButtonClass = "flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary";

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(new Set<string>());
  const labelsRef = useRef(true);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [basemap, setBasemap] = useState(false);
  const [hovered, setHovered] = useState<{ name: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [baseZoom, setBaseZoom] = useState(DEFAULT_ZOOM);

  // ---- map creation ----
  useEffect(() => {
    if (!containerRef.current) return;
    let dead = false;
    let map: maplibregl.Map | null = null;
    const loaded = loadedRef.current;
    let hoverRaf: number | null = null;
    let themeObserver: MutationObserver | null = null;

    const initial = readInitialView();
    labelsRef.current = initial.showLabels;
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
          attributionControl: { compact: true },
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

          m.addSource("states", { type: "geojson", data: geo });
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
              "fill-color": terrainElevationExpr(c.choro) as any,
              "fill-opacity": 1.0,
            },
          });

          // 2. Real physical hillshade relief draped over the elevation-colored land
          m.addLayer({
            id: "hillshade",
            type: "raster",
            source: "hillshade",
            paint: {
              "raster-opacity": lastDark ? 0.05 : 0.07,
              "raster-contrast": 0.60,
              "raster-brightness-max": 0.85,
            },
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
            paint: {
              "line-color": c.border,
              "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 1, 10, 2],
              "line-opacity": 0.7,
            },
          });

          m.addLayer({
            id: "state-labels",
            type: "symbol",
            source: "state-centroids",
            layout: {
              "text-field": ["get", "ST_NM"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 5, 11, 7, 14],
              "text-font": [LABEL_FONT_BOLD],
              "text-allow-overlap": false,
              "text-padding": 4,
              visibility: labelsRef.current ? "visible" : "none",
            },
            paint: {
              "text-color": c.labelText,
              "text-halo-color": c.labelHalo,
              "text-halo-width": 2.2,
              "text-halo-blur": 0.5,
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
            m.getCanvas().style.cursor = name ? "pointer" : "";
            setHovered(name ? { name, x: clientX, y: clientY } : null);
          });
        });
        m.on("mouseout", () => setHovered(null));

        const restyle = () => {
          if (!m.getLayer("state-fill")) return;
          const colors = tc();
          const dark = isDark();

          m.setPaintProperty("bg", "background-color", colors.bg);
          m.setPaintProperty("state-fill", "fill-color", terrainElevationExpr(colors.choro) as any);
          m.setPaintProperty("state-fill", "fill-opacity", 1.0);
          if (m.getLayer("hillshade")) {
            m.setPaintProperty("hillshade", "raster-opacity", dark ? 0.05 : 0.07);
          }
          if (m.getLayer("country-mask")) {
            m.setPaintProperty("country-mask", "fill-color", colors.bg);
          }
          m.setPaintProperty("state-line", "line-color", colors.border);
          m.setPaintProperty("state-labels", "text-color", colors.labelText);
          m.setPaintProperty("state-labels", "text-halo-color", colors.labelHalo);

          loadedRef.current.forEach((code) => {
            if (m.getLayer(`d-line-${code}`)) m.setPaintProperty(`d-line-${code}`, "line-color", colors.text);
            if (m.getLayer(`d-label-${code}`)) {
              m.setPaintProperty(`d-label-${code}`, "text-color", colors.labelText);
              m.setPaintProperty(`d-label-${code}`, "text-halo-color", colors.districtHalo);
            }
          });

          if (dark !== lastDark) {
            lastDark = dark;
            const visibility = m.getLayoutProperty("basemap", "visibility");
            m.removeLayer("basemap");
            m.removeSource("carto");
            m.addSource("carto", basemapSource(dark));
            m.addLayer(
              { id: "basemap", type: "raster", source: "carto", layout: { visibility }, paint: { "raster-opacity": 0.45 } },
              "state-fill",
            );

            if (m.getLayer("hillshade")) {
              m.removeLayer("hillshade");
              m.removeSource("hillshade");
              m.addSource("hillshade", hillshadeSource(dark));
              m.addLayer(
                {
                  id: "hillshade",
                  type: "raster",
                  source: "hillshade",
                  paint: {
                    "raster-opacity": dark ? 0.05 : 0.07,
                    "raster-contrast": 0.60,
                    "raster-brightness-max": 0.85,
                  },
                },
                "country-mask",
              );
            }
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
  };

  const resetView = () => {
    mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: 30, duration: 500 });
  };

  const doZoomIn = () => mapRef.current?.zoomIn({ duration: 200 });
  const doZoomOut = () => mapRef.current?.zoomOut({ duration: 200 });

  const pct = Math.round(Math.pow(2, zoom - baseZoom) * 100);
  const hasZoomed = Math.abs(zoom - baseZoom) > 0.1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      <Header breadcrumbs={[{ label: "Map", href: "/map" }]} />

      <main className="relative min-h-0 flex-1">
        <div ref={containerRef} className="h-full w-full" role="region" aria-label="Map of India by state and district" />

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
          <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-2">
            <LinkButton href="/" variant="overlay" iconOnly title="Back" aria-label="Back to home">
              <Icon name="arrow-left" />
            </LinkButton>
            {zoom < DISTRICT_MIN_ZOOM && (
              <span className={pillClass}>Zoom in to see districts</span>
            )}
          </div>

          <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
            <span className={`${pillClass} font-mono`}>{pct}%</span>
            <Button variant="overlay" iconOnly pressed={showLabels} onClick={toggleLabels} title="Toggle labels" aria-label="Show labels">
              <Icon name="tag" />
            </Button>
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 z-10">
            <Button variant="overlay" iconOnly pressed={basemap} onClick={toggleBasemap} title="Toggle basemap" aria-label="Show basemap">
              <Icon name="globe" />
            </Button>
          </div>

          <div className="pointer-events-auto absolute bottom-10 right-4 z-10 flex flex-col items-end gap-2">
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
