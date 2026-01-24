"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import * as d3 from "d3";
import { Header, PageLoader } from "@/components";
import { VIEWBOX, VIEWBOX_STR, indiaProjection, stateNameToCode } from "@/lib/map-projection";

interface GeoFeature {
  type: string;
  properties: { ST_NM?: string; district?: string };
  geometry: unknown;
}

interface GeoCollection {
  type: string;
  features: GeoFeature[];
}

const LOD_DEBOUNCE_MS = 180;
const LOADER_MIN_MS = 500;

const NO_DISTRICT_LABEL_STATES = new Set<string>(["DL", "CH", "PY", "DD", "LD", "AN"]);
const DISTRICT_LABEL_ZOOM = 4.1;

const MAP_LOADER_CSS = `
@keyframes map-loader-pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
@keyframes map-loader-ripple { 0% { transform: scale(1); opacity: 0.8; border-width: 2px; } 100% { transform: scale(4); opacity: 0; border-width: 0; } }
@keyframes map-loader-ripple-lg { 0% { transform: scale(1); opacity: 0.6; border-width: 2px; } 100% { transform: scale(6); opacity: 0; border-width: 0; } }
@keyframes map-loader-text { 0% { opacity: 0.4; } 50% { opacity: 0.9; } 100% { opacity: 0.4; } }
.map-loader-pulse { animation: map-loader-pulse 1.2s ease-in-out infinite; will-change: transform, opacity; }
.map-loader-ripple { animation: map-loader-ripple 1.2s ease-out infinite; will-change: transform, opacity; }
.map-loader-ripple-lg { animation: map-loader-ripple-lg 1.2s ease-out infinite; animation-delay: 0.2s; will-change: transform, opacity; }
.map-loader-text { animation: map-loader-text 1.2s ease-in-out infinite; }
`;

function applyTransform(g: SVGGElement | null, t: d3.ZoomTransform) {
  if (!g) return;
  g.setAttribute("transform", `translate(${t.x},${t.y}) scale(${t.k})`);
}

export default function MapPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [indiaGeo, setIndiaGeo] = useState<GeoCollection | null>(null);
  const [lod, setLod] = useState({ k: 1, x: 0, y: 0 });
  const [districtGeo, setDistrictGeo] = useState<Record<string, GeoCollection>>({});
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [hovered, setHovered] = useState<{ type: "state"; name: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const requestedStates = useRef<Set<string>>(new Set());
  const districtFetchInFlight = useRef(0);
  const loaderDistrictsShownAt = useRef(0);
  const lodDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextZoom = useRef(false);

  const projection = useMemo(() => indiaProjection(), []);
  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const { k, x: tx, y: ty } = lod;
  const visibleBounds = useMemo(() => {
    const m = 0.4;
    const minX = (VIEWBOX.x - tx) / k;
    const minY = (VIEWBOX.y - ty) / k;
    const maxX = (VIEWBOX.x + VIEWBOX.w - tx) / k;
    const maxY = (VIEWBOX.y + VIEWBOX.h - ty) / k;
    const padX = (maxX - minX) * m;
    const padY = (maxY - minY) * m;
    return {
      minX: minX - padX,
      minY: minY - padY,
      maxX: maxX + padX,
      maxY: maxY + padY,
    };
  }, [k, tx, ty]);

  const labelBounds = useMemo(() => {
    const minX = (VIEWBOX.x - tx) / k;
    const minY = (VIEWBOX.y - ty) / k;
    const maxX = (VIEWBOX.x + VIEWBOX.w - tx) / k;
    const maxY = (VIEWBOX.y + VIEWBOX.h - ty) / k;
    const pad = 0.2;
    const w = maxX - minX;
    const h = maxY - minY;
    return {
      minX: minX - w * pad,
      minY: minY - h * pad,
      maxX: maxX + w * pad,
      maxY: maxY + h * pad,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, [k, tx, ty]);

  const showDistricts = k >= 2;

  useEffect(() => {
    fetch("/india-states.json")
      .then((r) => r.json())
      .then(setIndiaGeo)
      .catch(console.error);
  }, []);

  const statePaths = useMemo(() => {
    if (!indiaGeo?.features?.length) return [];
    return indiaGeo.features.map((f) => {
      const name = f.properties.ST_NM ?? "";
      const stateCode = stateNameToCode[name] ?? null;
      const pathString = pathGen(f as unknown as d3.GeoPermissibleObjects) ?? "";
      const centroid = pathGen.centroid(f as unknown as d3.GeoPermissibleObjects);
      const b = pathGen.bounds(f as unknown as d3.GeoPermissibleObjects);
      const bbox = { minX: b[0][0], minY: b[0][1], maxX: b[1][0], maxY: b[1][1] };
      const labelPos: [number, number] = [
        (bbox.minX + bbox.maxX) / 2,
        (bbox.minY + bbox.maxY) / 2,
      ];
      return {
        stateCode,
        stateName: name,
        pathString,
        centroid,
        bbox,
        labelPos,
      };
    });
  }, [indiaGeo, pathGen]);

  const indiaBounds = useMemo(() => {
    if (!statePaths.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of statePaths) {
      minX = Math.min(minX, s.bbox.minX);
      minY = Math.min(minY, s.bbox.minY);
      maxX = Math.max(maxX, s.bbox.maxX);
      maxY = Math.max(maxY, s.bbox.maxY);
    }
    return { minX, minY, maxX, maxY };
  }, [statePaths]);

  const visibleStateCodes = useMemo(() => {
    return statePaths
      .filter((s) => {
        const b = s.bbox;
        return (
          b.minX <= visibleBounds.maxX &&
          b.maxX >= visibleBounds.minX &&
          b.minY <= visibleBounds.maxY &&
          b.maxY >= visibleBounds.minY
        );
      })
      .map((s) => s.stateCode)
      .filter((c): c is string => !!c);
  }, [statePaths, visibleBounds]);

  useEffect(() => {
    if (!showDistricts || visibleStateCodes.length === 0) {
      if (districtFetchInFlight.current === 0) setLoadingDistricts(false);
      return;
    }
    const toLoad = visibleStateCodes.filter((c) => !requestedStates.current.has(c));
    if (toLoad.length === 0) {
      if (districtFetchInFlight.current === 0) setLoadingDistricts(false);
      return;
    }
    districtFetchInFlight.current += toLoad.length;
    loaderDistrictsShownAt.current = Date.now();
    setLoadingDistricts(true);
    toLoad.forEach((code) => {
      requestedStates.current.add(code);
      fetch(`/geo/states/${code}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setDistrictGeo((prev) => ({ ...prev, [code]: data }));
        })
        .catch(() => {})
        .finally(() => {
          districtFetchInFlight.current = Math.max(0, districtFetchInFlight.current - 1);
          if (districtFetchInFlight.current > 0) {
            setLoadingDistricts(true);
            return;
          }
          const remain = Math.max(0, LOADER_MIN_MS - (Date.now() - loaderDistrictsShownAt.current));
          if (remain > 0) setTimeout(() => setLoadingDistricts(false), remain);
          else setLoadingDistricts(false);
        });
    });
  }, [showDistricts, visibleStateCodes]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current || !indiaGeo) return;

    const scheduleLod = () => {
      if (lodDebounce.current) clearTimeout(lodDebounce.current);
      lodDebounce.current = setTimeout(() => {
        lodDebounce.current = null;
        const t = transformRef.current;
        setLod({ k: t.k, x: t.x, y: t.y });
      }, LOD_DEBOUNCE_MS);
    };

    const clampTransform = (t: d3.ZoomTransform): d3.ZoomTransform => {
      if (!indiaBounds) return t;
      const k = t.k;
      const margin = 20;
      const minTx = VIEWBOX.x - k * indiaBounds.maxX + margin;
      const maxTx = VIEWBOX.x + VIEWBOX.w - k * indiaBounds.minX - margin;
      const minTy = VIEWBOX.y - k * indiaBounds.maxY + margin;
      const maxTy = VIEWBOX.y + VIEWBOX.h - k * indiaBounds.minY - margin;
      let tx = Math.max(minTx, Math.min(maxTx, t.x));
      let ty = Math.max(minTy, Math.min(maxTy, t.y));
      if (tx !== t.x || ty !== t.y) return d3.zoomIdentity.translate(tx, ty).scale(k);
      return t;
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 32])
      .filter((ev) => !(ev as MouseEvent).ctrlKey && (ev.type === "wheel" || (ev as MouseEvent).button === 0))
      .wheelDelta((ev) => {
        const d = (ev as WheelEvent).deltaY;
        if ((ev as WheelEvent).deltaMode === 1) return -d * 0.5;
        if ((ev as WheelEvent).deltaMode === 2) return -d * 2;
        return -d * 0.002;
      })
      .on("zoom", (ev) => {
        if (skipNextZoom.current) {
          skipNextZoom.current = false;
          transformRef.current = ev.transform;
          applyTransform(gRef.current, ev.transform);
          scheduleLod();
          return;
        }
        let t = clampTransform(ev.transform);
        if (t !== ev.transform) {
          skipNextZoom.current = true;
          d3.select(svgRef.current!).call(zoom.transform as (s: d3.Selection<SVGSVGElement, unknown, null, undefined>, t: d3.ZoomTransform) => void, t);
          return;
        }
        transformRef.current = t;
        applyTransform(gRef.current, t);
        scheduleLod();
      });

    zoomRef.current = zoom;
    const node = svgRef.current;
    d3.select(node).call(zoom);
    applyTransform(gRef.current, d3.zoomIdentity);

    const onWheel = (e: WheelEvent) => e.preventDefault();
    node.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      node.removeEventListener("wheel", onWheel);
      d3.select(node).on(".zoom", null);
      if (lodDebounce.current) clearTimeout(lodDebounce.current);
    };
  }, [indiaGeo, indiaBounds]);

  const centerX = VIEWBOX.x + VIEWBOX.w / 2;
  const centerY = VIEWBOX.y + VIEWBOX.h / 2;

  const runZoom = useCallback((next: d3.ZoomTransform) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).call(
      zoomRef.current.transform as (s: d3.Selection<SVGSVGElement, unknown, null, undefined>, t: d3.ZoomTransform) => void,
      next
    );
    transformRef.current = next;
    applyTransform(gRef.current, next);
    setLod({ k: next.k, x: next.x, y: next.y });
  }, []);

  const resetZoom = useCallback(() => {
    runZoom(d3.zoomIdentity);
  }, [runZoom]);

  const zoomTowardCenter = useCallback(
    (factor: number) => {
      if (!svgRef.current) return;
      const z = transformRef.current;
      const k2 = Math.min(32, Math.max(0.5, z.k * factor));
      const x2 = z.x + centerX * (z.k - k2);
      const y2 = z.y + centerY * (z.k - k2);
      runZoom(d3.zoomIdentity.scale(k2).translate(x2, y2));
    },
    [runZoom, centerX, centerY]
  );

  const zoomIn = useCallback(() => zoomTowardCenter(1.5), [zoomTowardCenter]);
  const zoomOut = useCallback(() => zoomTowardCenter(1 / 1.5), [zoomTowardCenter]);

  const districtPaths = useMemo(() => {
    const out: {
      stateCode: string;
      name: string;
      pathString: string;
      centroid: [number, number];
      labelPos: [number, number];
    }[] = [];
    visibleStateCodes.forEach((code) => {
      const col = districtGeo[code];
      if (!col?.features?.length) return;
      col.features.forEach((f) => {
        const name = f.properties.district ?? "";
        const d = pathGen(f as unknown as d3.GeoPermissibleObjects);
        const c = pathGen.centroid(f as unknown as d3.GeoPermissibleObjects);
        const b = pathGen.bounds(f as unknown as d3.GeoPermissibleObjects);
        if (d) {
          const labelPos: [number, number] = [
            (b[0][0] + b[1][0]) / 2,
            (b[0][1] + b[1][1]) / 2,
          ];
          out.push({ stateCode: code, name, pathString: d, centroid: c, labelPos });
        }
      });
    });
    return out;
  }, [visibleStateCodes, districtGeo, pathGen]);

  const visibleStateLabels = useMemo(() => {
    const b = labelBounds;
    const inView = statePaths.filter((s) => {
      const [cx, cy] = s.labelPos;
      return cx >= b.minX && cx <= b.maxX && cy >= b.minY && cy <= b.maxY;
    });
    if (k <= 2.5) return inView;
    return inView.filter((s) => s.stateCode && NO_DISTRICT_LABEL_STATES.has(s.stateCode));
  }, [statePaths, labelBounds, k]);

  const visibleDistrictLabels = useMemo(() => {
    if (!showDistricts || k < DISTRICT_LABEL_ZOOM) return [];
    const b = labelBounds;
    const inView = districtPaths.filter((d) => {
      const [cx, cy] = d.labelPos;
      if (cx < b.minX || cx > b.maxX || cy < b.minY || cy > b.maxY) return false;
      if (NO_DISTRICT_LABEL_STATES.has(d.stateCode)) return false;
      return true;
    });
    const cx = b.centerX;
    const cy = b.centerY;
    inView.sort((a, b) => {
      const dxa = a.labelPos[0] - cx;
      const dya = a.labelPos[1] - cy;
      const dxb = b.labelPos[0] - cx;
      const dyb = b.labelPos[1] - cy;
      const da = dxa * dxa + dya * dya;
      const db = dxb * dxb + dyb * dyb;
      return da - db;
    });
    return inView.slice(0, 40);
  }, [showDistricts, districtPaths, labelBounds, k]);

  const stateLabelFontSize = Math.max(2, Math.min(14, 14 / k));
  const districtLabelFontSize = Math.max(2.5, 3.5 / k);

  const strokeWidth = (base: number) => Math.max(0.3, base / k);
  const hasZoomed = tx !== 0 || ty !== 0 || k !== 1;

  if (!indiaGeo) return <PageLoader />;

  const gTransform = `translate(${transformRef.current.x},${transformRef.current.y}) scale(${transformRef.current.k})`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      <Header breadcrumbs={[{ label: "Map", href: "/map" }]} />

      <main className="relative min-h-0 flex-1">
        {loadingDistricts && (
          <>
            <style>{MAP_LOADER_CSS}</style>
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-bg-primary/85 backdrop-blur-sm pointer-events-none"
              aria-hidden
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative flex items-center justify-center">
                  <div className="map-loader-pulse relative z-10 h-4 w-4 rounded-full bg-accent-primary shadow-[0_0_20px_var(--accent-primary)]" />
                  <div className="map-loader-ripple absolute h-4 w-4 rounded-full border-2 border-accent-primary/50" />
                  <div className="map-loader-ripple-lg absolute h-4 w-4 rounded-full border-2 border-accent-primary/30" />
                </div>
                <p className="map-loader-text text-sm font-medium tracking-wide text-accent-primary">
                  Loading districts…
                </p>
              </div>
            </div>
          </>
        )}
        <svg
          ref={svgRef}
          viewBox={VIEWBOX_STR}
          className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
          preserveAspectRatio="xMidYMid meet"
          style={{ touchAction: "none" }}
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
          <g ref={gRef} transform={gTransform} style={{ willChange: "transform" }}>
            <g className="states">
              {statePaths.map((s, i) => (
                <path
                  key={`s-${i}`}
                  d={s.pathString}
                  fill="var(--accent-primary)"
                  stroke="var(--map-border-color)"
                  strokeWidth={strokeWidth(0.6)}
                  onMouseEnter={() => setHovered({ type: "state", name: s.stateName })}
                  onMouseLeave={() => setHovered((h) => (h?.type === "state" ? null : h))}
                />
              ))}
            </g>

            {showDistricts &&
              districtPaths.map((d, i) => (
                <path
                  key={`d-${d.stateCode}-${i}`}
                  d={d.pathString}
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth={strokeWidth(0.5)}
                  strokeOpacity={0.4}
                  className="pointer-events-none"
                />
              ))}

            {showLabels && (
              <g className="labels pointer-events-none">
                {visibleStateLabels.map((s, i) => (
                  <text
                    key={`l-${s.stateCode}-${i}`}
                    x={s.labelPos[0]}
                    y={s.labelPos[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-primary)"
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    style={{
                      fontSize: stateLabelFontSize,
                      fontWeight: 500,
                      paintOrder: "stroke fill",
                    }}
                  >
                    {s.stateName}
                  </text>
                ))}
                {visibleDistrictLabels.map((d, i) => (
                  <text
                    key={`ld-${d.stateCode}-${d.name}-${i}`}
                    x={d.labelPos[0]}
                    y={d.labelPos[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-primary)"
                    stroke="var(--bg-card)"
                    strokeWidth={1.5}
                    strokeOpacity={0.85}
                    style={{
                      fontSize: districtLabelFontSize,
                      fontWeight: 500,
                      paintOrder: "stroke fill",
                    }}
                  >
                    {d.name}
                  </text>
                ))}
              </g>
            )}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-2">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
              title="Back to India"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            {k < 2 && (
              <span className="rounded-full bg-bg-card/90 px-3 py-1.5 text-xs text-text-muted backdrop-blur-sm">
                Zoom in to see districts
              </span>
            )}
          </div>
          <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
            <span className="rounded-full bg-bg-card/90 px-2.5 py-1.5 font-mono text-xs text-text-muted backdrop-blur-sm">
              {Math.round(k * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
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
          <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
            {hasZoomed && (
              <button
                type="button"
                onClick={resetZoom}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-bg-card/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-secondary"
                title="Reset zoom"
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
                onClick={zoomIn}
                className="flex h-9 w-9 items-center justify-center border-b border-border-light text-text-secondary transition-colors hover:bg-bg-secondary"
                title="Zoom in"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={zoomOut}
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
            {hovered.name}
          </div>
        )}
      </main>
    </div>
  );
}
