"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components";
import { states as allStates } from "@/data/india";
import { stateNameToCode } from "@/lib/map-projection";
import type { MapMetric } from "@/lib/map-view";

const INDIA_CENTER: [number, number] = [82, 22];
const DEFAULT_ZOOM = 4;
const DISTRICT_MIN_ZOOM = 5.5;
const DISTRICT_LABELS_MIN_ZOOM = 6.5;
const STATE_LABELS_MAX_ZOOM = 7;
const SKIP_DISTRICT_LABELS = new Set(["DL", "CH", "PY", "DD", "LD", "AN"]);
const VALID_METRICS: MapMetric[] = [
  "population", "gdp", "literacyRate", "hdi", "density", "sexRatio", "area",
];

const codeToName = Object.fromEntries(
  Object.entries(stateNameToCode).map(([name, code]) => [code, name]),
);

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function tc() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return {
    bg: v("--bg-primary"),
    card: v("--bg-card"),
    text: v("--text-primary"),
    border: v("--map-border-color"),
    choro: Array.from({ length: 10 }, (_, i) => v(`--choro-${i}`)),
  };
}

function choroplethExpr(metric: MapMetric, choro: string[]): unknown[] {
  const ranked = allStates
    .map((st) => ({ id: st.id, val: st[metric] as number }))
    .filter((st) => st.val != null)
    .sort((a, b) => b.val - a.val);

  let idx: number[];
  if (metric === "sexRatio") idx = [1, 2, 4, 5, 7, 8, 9];
  else if (metric === "area") idx = [0, 1, 2, 4, 6, 7, 8, 9];
  else if (metric === "hdi" || metric === "literacyRate") idx = [1, 2, 3, 5, 6, 8, 9];
  else idx = [0, 1, 3, 5, 7, 8, 9];

  const pal = idx.map((i) => choro[i]);
  const expr: unknown[] = ["match", ["get", "ST_NM"]];

  ranked.forEach((item, rank) => {
    const name = codeToName[item.id];
    if (!name) return;
    const t = rank / Math.max(ranked.length - 1, 1);
    const ci = Math.min(Math.floor(t * pal.length), pal.length - 1);
    expr.push(name, pal[pal.length - 1 - ci]);
  });

  expr.push(choro[5]);
  return expr;
}

function parseParams() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const lng = parseFloat(p.get("lng") || "");
  const lat = parseFloat(p.get("lat") || "");
  const z = parseFloat(p.get("z") || "");
  const m = p.get("m") as MapMetric | null;
  const labels = p.get("labels");
  return {
    center: (isFinite(lng) && isFinite(lat) ? [lng, lat] : INDIA_CENTER) as [number, number],
    zoom: isFinite(z) ? Math.max(3, Math.min(14, z)) : DEFAULT_ZOOM,
    metric: (m && VALID_METRICS.includes(m) ? m : "population") as MapMetric,
    showLabels: labels !== "0",
  };
}

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(new Set<string>());
  const metricRef = useRef<MapMetric>("population");
  const labelsRef = useRef(true);

  const [ready, setReady] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [metric, setMetric] = useState<MapMetric>("population");
  const [basemap, setBasemap] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  metricRef.current = metric;
  labelsRef.current = showLabels;

  const init = useMemo(parseParams, []);

  // ---- map creation ----
  useEffect(() => {
    if (!containerRef.current) return;
    let dead = false;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (dead || !containerRef.current) return;

      const c = tc();
      const dark = isDark();
      const p = init ?? {
        center: INDIA_CENTER,
        zoom: DEFAULT_ZOOM,
        metric: "population" as MapMetric,
        showLabels: true,
      };

      setMetric(p.metric);
      setShowLabels(p.showLabels);
      labelsRef.current = p.showLabels;
      metricRef.current = p.metric;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: {
          version: 8 as const,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            carto: {
              type: "raster",
              tiles: [
                dark
                  ? "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"
                  : "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
              ],
              tileSize: 256,
              attribution: "CARTO, OpenStreetMap",
            },
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
        center: p.center,
        zoom: p.zoom,
        minZoom: 3,
        maxZoom: 14,
        maxBounds: [[55, 2], [105, 42]],
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (dead) return;
        map.resize();

        map.addSource("states", { type: "geojson", data: "/india-states.json" });

        map.addLayer({
          id: "state-fill",
          type: "fill",
          source: "states",
          paint: { "fill-color": choroplethExpr(p.metric, c.choro) as any },
        });

        map.addLayer({
          id: "state-line",
          type: "line",
          source: "states",
          paint: {
            "line-color": c.border,
            "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 1, 10, 2],
            "line-opacity": 0.7,
          },
        });

        map.addLayer({
          id: "state-labels",
          type: "symbol",
          source: "states",
          layout: {
            "text-field": ["get", "ST_NM"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 5, 11, 7, 14],
            "text-font": ["Open Sans Semibold"],
            "text-allow-overlap": false,
            "text-padding": 4,
            visibility: p.showLabels ? "visible" : "none",
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
        setZoom(map.getZoom());
        tryLoadDistricts(map);
      });

      map.on("zoomend", () => {
        setZoom(map.getZoom());
        tryLoadDistricts(map);
      });
      map.on("moveend", () => tryLoadDistricts(map));

      map.on("mousemove", (e) => {
        const fs = map.queryRenderedFeatures(e.point);
        for (const f of fs) {
          if (f.layer.id.startsWith("d-fill-")) {
            setHovered(f.properties?.district || null);
            setMousePos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
            map.getCanvas().style.cursor = "pointer";
            return;
          }
          if (f.layer.id === "state-fill") {
            setHovered(f.properties?.ST_NM || null);
            setMousePos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
            map.getCanvas().style.cursor = "pointer";
            return;
          }
        }
        setHovered(null);
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function tryLoadDistricts(map: maplibregl.Map) {
    if (map.getZoom() < DISTRICT_MIN_ZOOM) return;
    const rendered = map.queryRenderedFeatures(undefined, { layers: ["state-fill"] });
    const need = new Set<string>();
    for (const f of rendered) {
      const code = stateNameToCode[f.properties?.ST_NM];
      if (code && !loadedRef.current.has(code)) need.add(code);
    }

    need.forEach((code) => {
      loadedRef.current.add(code);
      fetch(`/geo/states/${code}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !mapRef.current) return;
          const m = mapRef.current;
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

          if (!SKIP_DISTRICT_LABELS.has(code)) {
            m.addLayer(
              {
                id: `d-label-${code}`,
                type: "symbol",
                source: src,
                layout: {
                  "text-field": ["get", "district"],
                  "text-size": ["interpolate", ["linear"], ["zoom"], 6, 9, 9, 12, 12, 14],
                  "text-font": ["Open Sans Semibold"],
                  "text-allow-overlap": false,
                  "text-optional": true,
                  "text-padding": 6,
                  visibility: labelsRef.current ? "visible" : "none",
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
        })
        .catch(() => {});
    });
  }

  // ---- theme reactivity ----
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready) return;

    const update = () => {
      const c = tc();
      const dark = isDark();

      if (m.getLayer("bg")) m.setPaintProperty("bg", "background-color", c.bg);
      if (m.getLayer("state-fill"))
        m.setPaintProperty("state-fill", "fill-color", choroplethExpr(metricRef.current, c.choro) as any);
      if (m.getLayer("state-line")) m.setPaintProperty("state-line", "line-color", c.border);
      if (m.getLayer("state-labels")) {
        m.setPaintProperty("state-labels", "text-color", c.text);
        m.setPaintProperty("state-labels", "text-halo-color", c.card);
      }

      loadedRef.current.forEach((code) => {
        if (m.getLayer(`d-line-${code}`)) m.setPaintProperty(`d-line-${code}`, "line-color", c.text);
        if (m.getLayer(`d-label-${code}`)) {
          m.setPaintProperty(`d-label-${code}`, "text-color", c.text);
          m.setPaintProperty(`d-label-${code}`, "text-halo-color", c.card);
        }
      });

      try {
        const wasVis = m.getLayoutProperty("basemap", "visibility") === "visible";
        m.removeLayer("basemap");
        m.removeSource("carto");
        m.addSource("carto", {
          type: "raster",
          tiles: [
            dark
              ? "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"
              : "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
        });
        m.addLayer(
          {
            id: "basemap",
            type: "raster",
            source: "carto",
            layout: { visibility: wasVis ? "visible" : "none" },
            paint: { "raster-opacity": 0.45 },
          },
          "state-fill",
        );
      } catch {}
    };

    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [ready]);

  // ---- controls ----
  const toggleLabels = useCallback(() => {
    setShowLabels((prev) => {
      const next = !prev;
      const m = mapRef.current;
      if (!m) return next;
      const vis = next ? "visible" : ("none" as const);
      if (m.getLayer("state-labels")) m.setLayoutProperty("state-labels", "visibility", vis);
      loadedRef.current.forEach((code) => {
        if (m.getLayer(`d-label-${code}`)) m.setLayoutProperty(`d-label-${code}`, "visibility", vis);
      });
      return next;
    });
  }, []);

  const toggleBasemap = useCallback(() => {
    setBasemap((prev) => {
      const next = !prev;
      const m = mapRef.current;
      if (m?.getLayer("basemap")) m.setLayoutProperty("basemap", "visibility", next ? "visible" : "none");
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({ center: INDIA_CENTER, zoom: DEFAULT_ZOOM, duration: 500 });
  }, []);

  const doZoomIn = useCallback(() => mapRef.current?.zoomIn({ duration: 200 }), []);
  const doZoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 200 }), []);

  const pct = Math.round(Math.pow(2, zoom - DEFAULT_ZOOM) * 100);
  const hasZoomed = Math.abs(zoom - DEFAULT_ZOOM) > 0.1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      <Header breadcrumbs={[{ label: "Map", href: "/map" }]} />

      <main className="relative min-h-0 flex-1">
        <div ref={containerRef} className="h-full w-full" />

        {!ready && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-primary">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-2">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
            {hasZoomed && (
              <button
                type="button"
                onClick={resetView}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
                title="Reset"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={doZoomOut}
                className="flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:bg-bg-secondary"
                title="Zoom out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {hovered && (
          <div
            className="pointer-events-none fixed z-50 rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-bg-primary shadow-lg"
            style={{ left: mousePos.x + 12, top: mousePos.y - 8 }}
          >
            {hovered}
          </div>
        )}
      </main>
    </div>
  );
}
