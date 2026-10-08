"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components";
import { stateNameToCode } from "@/lib/map-projection";
import {
  colorIndexForRank,
  getMetricPaletteIndices,
  isMapMetric,
  rankStatesByMetric,
  type MapMetric,
} from "@/lib/map-view";

const INDIA_CENTER: [number, number] = [82, 22];
const INDIA_BOUNDS: [[number, number], [number, number]] = [[68, 6], [98, 38]];
const DEFAULT_ZOOM = 4;
const DISTRICT_MIN_ZOOM = 5.5;
const DISTRICT_LABELS_MIN_ZOOM = 6.5;
const STATE_LABELS_MAX_ZOOM = 7;
const SKIP_DISTRICT_LABELS = new Set(["DL", "CH", "PY", "DD", "LD", "AN"]);
// OpenFreeMap's public glyph server (the MapLibre demo server isn't meant for production use)
const GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const LABEL_FONT = "Noto Sans Regular";
const LABEL_FONT_BOLD = "Noto Sans Bold";
const BASEMAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

const codeToName = Object.fromEntries(
  Object.entries(stateNameToCode).map(([name, code]) => [code, name]),
);

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
  return {
    bg: resolveCSS("var(--bg-primary)"),
    card: resolveCSS("var(--bg-card)"),
    text: resolveCSS("var(--text-primary)"),
    border: resolveCSS("var(--map-border-color)"),
    choro: Array.from({ length: 10 }, (_, i) => resolveCSS(`var(--choro-${i})`)),
  };
}

type FillColor = NonNullable<Extract<maplibregl.AddLayerObject, { type: "fill" }>["paint"]>["fill-color"];

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

function choroplethExpr(metric: MapMetric, choro: string[]): FillColor {
  const ranked = rankStatesByMetric(metric);
  const pal = getMetricPaletteIndices(metric).map((i) => choro[i]);
  const expr: unknown[] = ["match", ["get", "ST_NM"]];

  ranked.forEach((id, rank) => {
    const name = codeToName[id];
    if (!name) return;
    expr.push(name, pal[colorIndexForRank(rank, ranked.length, pal.length)]);
  });

  expr.push(choro[5]);
  return expr as unknown as FillColor;
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
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 9, 9, 12, 12, 14],
        "text-font": [LABEL_FONT],
        "text-allow-overlap": false,
        "text-optional": true,
        "text-padding": 6,
        visibility: showLabels ? "visible" : "none",
      },
      paint: {
        "text-color": c.text,
        "text-halo-color": c.card,
        "text-halo-width": 1.2,
        "text-halo-blur": 0.3,
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
  const m = p.get("m");
  const hasPosition = isFinite(lng) && isFinite(lat) && isFinite(z) && z > 4.3;
  return {
    center: hasPosition ? ([lng, lat] as [number, number]) : null,
    zoom: hasPosition ? Math.max(3, Math.min(14, z)) : null,
    metric: isMapMetric(m) ? m : "population",
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
    const metric: MapMetric = initial.metric;
    let lastDark = isDark();

    // Fetch district boundaries for states in view once zoomed in far enough
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
            // Allow a retry on the next pan/zoom instead of never loading this state
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
            sources: { carto: basemapSource(lastDark) },
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
          // Shows the CARTO/OSM credit whenever the basemap layer is visible
          attributionControl: { compact: true },
        };

        if (initial.center && initial.zoom) {
          mapOpts.center = initial.center;
          mapOpts.zoom = initial.zoom;
        } else {
          mapOpts.bounds = INDIA_BOUNDS;
          mapOpts.fitBoundsOptions = { padding: 30 };
        }

        map = new maplibre.Map(mapOpts);
        mapRef.current = map;
        const m = map;

        m.on("load", async () => {
          if (dead) return;
          m.resize();
          setBaseZoom(m.getZoom());

          let geo: GeoJSON.FeatureCollection;
          try {
            const res = await fetch("/india-states.json");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            geo = await res.json();
          } catch (err) {
            console.error("Failed to load state boundaries", err);
            if (!dead) setLoadError(true);
            return;
          }
          if (dead) return;

          m.addSource("states", { type: "geojson", data: geo });
          m.addSource("state-centroids", {
            type: "geojson",
            data: centroidPoints(geo, (props) => ({ ST_NM: props?.ST_NM })),
          });

          m.addLayer({
            id: "state-fill",
            type: "fill",
            source: "states",
            paint: { "fill-color": choroplethExpr(metric, c.choro) },
          });

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
              "text-color": c.text,
              "text-halo-color": c.card,
              "text-halo-width": 1.5,
              "text-halo-blur": 0.5,
            },
            maxzoom: STATE_LABELS_MAX_ZOOM,
          });

          setReady(true);
          setZoom(m.getZoom());
          loadVisibleDistricts();
        });

        m.on("zoomend", () => setZoom(m.getZoom()));
        // moveend also fires after every zoom
        m.on("moveend", loadVisibleDistricts);

        m.on("mousemove", (e) => {
          const point = e.point;
          const { clientX, clientY } = e.originalEvent;
          if (hoverRaf) cancelAnimationFrame(hoverRaf);
          // Query once per frame rather than on every mouse event
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

        // Follow light/dark and accent color changes
        const restyle = () => {
          if (!m.getLayer("state-fill")) return;
          const colors = tc();
          const dark = isDark();

          m.setPaintProperty("bg", "background-color", colors.bg);
          m.setPaintProperty("state-fill", "fill-color", choroplethExpr(metric, colors.choro));
          m.setPaintProperty("state-line", "line-color", colors.border);
          m.setPaintProperty("state-labels", "text-color", colors.text);
          m.setPaintProperty("state-labels", "text-halo-color", colors.card);

          loadedRef.current.forEach((code) => {
            if (m.getLayer(`d-line-${code}`)) m.setPaintProperty(`d-line-${code}`, "line-color", colors.text);
            if (m.getLayer(`d-label-${code}`)) {
              m.setPaintProperty(`d-label-${code}`, "text-color", colors.text);
              m.setPaintProperty(`d-label-${code}`, "text-halo-color", colors.card);
            }
          });

          // Raster tiles can't be recolored, so swap the basemap source only when dark mode flips
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
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-primary" role="status" aria-label="Loading map">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-2">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
              title="Back"
              aria-label="Back to home"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            {zoom < DISTRICT_MIN_ZOOM && (
              <span className="rounded-full bg-bg-card/90 px-3 py-1.5 text-xs text-text-muted backdrop-blur-sm">
                Zoom in to see districts
              </span>
            )}
          </div>

          <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
            <span className="rounded-full bg-bg-card/90 px-2.5 py-1.5 font-mono text-xs text-text-muted backdrop-blur-sm">
              {pct}%
            </span>
            <button
              type="button"
              onClick={toggleLabels}
              className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                showLabels
                  ? "border-accent-primary bg-accent-primary text-white"
                  : "border-border-light bg-bg-card/90 text-text-secondary hover:bg-bg-secondary"
              }`}
              title="Toggle labels"
              aria-label="Show labels"
              aria-pressed={showLabels}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A1.994 1.994 0 0 1 3 12V7a4 4 0 0 1 4-4z" />
              </svg>
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 z-10">
            <button
              type="button"
              onClick={toggleBasemap}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium backdrop-blur-sm transition-colors ${
                basemap
                  ? "border-accent-primary bg-accent-primary text-white"
                  : "border-border-light bg-bg-card/90 text-text-secondary hover:bg-bg-secondary"
              }`}
              title="Toggle basemap"
              aria-label="Show basemap"
              aria-pressed={basemap}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-10 right-4 z-10 flex flex-col items-end gap-2">
            {hasZoomed && (
              <button
                type="button"
                onClick={resetView}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
                title="Reset"
                aria-label="Reset view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
            <div className="flex flex-col overflow-hidden rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={doZoomIn}
                className="flex h-9 w-9 items-center justify-center border-b border-border-light text-text-secondary transition-colors hover:bg-bg-secondary"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={doZoomOut}
                className="flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:bg-bg-secondary"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {hovered && (
          <div
            className="pointer-events-none fixed z-50 rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-bg-primary shadow-lg"
            style={{ left: hovered.x + 12, top: hovered.y - 8 }}
          >
            {hovered.name}
          </div>
        )}
      </main>
    </div>
  );
}
