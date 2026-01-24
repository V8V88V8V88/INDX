"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import * as d3 from "d3";
import { VIEWBOX, VIEWBOX_STR, indiaProjection, stateNameToCode } from "@/lib/map-projection";

interface GeoFeature {
  type: string;
  properties: { ST_NM?: string; district?: string; dtname?: string; sdtname?: string };
  geometry: unknown;
}

interface GeoCollection {
  type: string;
  features: GeoFeature[];
}

const LOD_DEBOUNCE_MS = 180;

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
  const [tehsilGeo, setTehsilGeo] = useState<GeoCollection | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [hovered, setHovered] = useState<{ type: "state"; name: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const requestedStates = useRef<Set<string>>(new Set());
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

  const showDistricts = k >= 2;
  const showTehsils = k >= 6;

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
      return {
        stateCode,
        stateName: name,
        pathString,
        centroid,
        bbox: { minX: b[0][0], minY: b[0][1], maxX: b[1][0], maxY: b[1][1] },
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
    if (!showDistricts || visibleStateCodes.length === 0) return;
    visibleStateCodes.forEach((code) => {
      if (requestedStates.current.has(code)) return;
      requestedStates.current.add(code);
      fetch(`/geo/states/${code}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setDistrictGeo((prev) => ({ ...prev, [code]: data }));
        })
        .catch(() => {});
    });
  }, [showDistricts, visibleStateCodes]);

  useEffect(() => {
    if (!showTehsils || !visibleStateCodes.includes("UP") || tehsilGeo) return;
    fetch("/geo/subdistricts/UP.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setTehsilGeo(data))
      .catch(() => {});
  }, [showTehsils, visibleStateCodes, tehsilGeo]);

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
    const out: { stateCode: string; name: string; pathString: string; centroid: [number, number] }[] = [];
    visibleStateCodes.forEach((code) => {
      const col = districtGeo[code];
      if (!col?.features?.length) return;
      col.features.forEach((f) => {
        const name = f.properties.district ?? "";
        const d = pathGen(f as unknown as d3.GeoPermissibleObjects);
        const c = pathGen.centroid(f as unknown as d3.GeoPermissibleObjects);
        if (d) out.push({ stateCode: code, name, pathString: d, centroid: c });
      });
    });
    return out;
  }, [visibleStateCodes, districtGeo, pathGen]);

  const tehsilPaths = useMemo(() => {
    if (!tehsilGeo?.features?.length || !showTehsils || !visibleStateCodes.includes("UP")) return [];
    return tehsilGeo.features
      .map((f) => {
        const name = f.properties.sdtname ?? f.properties.dtname ?? "";
        const d = pathGen(f as unknown as d3.GeoPermissibleObjects);
        const c = pathGen.centroid(f as unknown as d3.GeoPermissibleObjects);
        if (!d) return null;
        return { name, pathString: d, centroid: c };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
  }, [tehsilGeo, pathGen, showTehsils, visibleStateCodes]);

  const strokeWidth = (base: number) => Math.max(0.3, base / k);
  const hasZoomed = tx !== 0 || ty !== 0 || k !== 1;

  if (!indiaGeo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  const gTransform = `translate(${transformRef.current.x},${transformRef.current.y}) scale(${transformRef.current.k})`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-light bg-bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-2 rounded-lg border border-border-light bg-bg-secondary px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-sm text-text-muted">Zoom in: districts → tehsils (UP)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-bg-secondary px-2 py-1 font-mono text-xs text-text-muted">
            {Math.round(k * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
              showLabels
                ? "border-accent-primary bg-accent-primary text-white"
                : "border-border-light bg-bg-card text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            Labels
          </button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
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

            {showTehsils &&
              visibleStateCodes.includes("UP") &&
              tehsilPaths.map((t, i) => (
                <path
                  key={`t-${i}`}
                  d={t.pathString}
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth={strokeWidth(0.35)}
                  strokeOpacity={0.35}
                  className="pointer-events-none"
                />
              ))}

            {showLabels && (
              <g className="labels pointer-events-none">
                {k <= 2.5 &&
                  statePaths.map((s, i) => {
                    if (!s.centroid[0] || !s.centroid[1]) return null;
                    const fs = Math.max(3, 7 / k);
                    return (
                      <text
                        key={`l-${i}`}
                        x={s.centroid[0]}
                        y={s.centroid[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-primary)"
                        stroke="var(--bg-card)"
                        strokeWidth={1.2}
                        strokeOpacity={0.9}
                        style={{ fontSize: fs, fontWeight: 500, paintOrder: "stroke fill" }}
                      >
                        {s.stateName}
                      </text>
                    );
                  })}
                {showDistricts &&
                  k > 5 &&
                  districtPaths.slice(0, 35).map((d, i) => {
                    const fs = Math.max(2.5, 5 / k);
                    return (
                      <text
                        key={`ld-${i}`}
                        x={d.centroid[0]}
                        y={d.centroid[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-secondary)"
                        stroke="var(--bg-card)"
                        strokeWidth={1}
                        strokeOpacity={0.85}
                        style={{ fontSize: fs, fontWeight: 500, paintOrder: "stroke fill" }}
                      >
                        {d.name}
                      </text>
                    );
                  })}
                {showTehsils &&
                  k > 10 &&
                  tehsilPaths.slice(0, 45).map((t, i) => {
                    const fs = Math.max(2, 3.5 / k);
                    return (
                      <text
                        key={`lt-${i}`}
                        x={t.centroid[0]}
                        y={t.centroid[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-tertiary)"
                        stroke="var(--bg-card)"
                        strokeWidth={0.8}
                        strokeOpacity={0.8}
                        style={{ fontSize: fs, fontWeight: 400, paintOrder: "stroke fill" }}
                      >
                        {t.name}
                      </text>
                    );
                  })}
              </g>
            )}
          </g>
        </svg>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {hasZoomed && (
            <button
              type="button"
              onClick={resetZoom}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-border-light bg-bg-card px-3 text-xs font-medium text-text-secondary shadow-md transition-colors hover:bg-bg-secondary"
              title="Reset"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          )}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border-light bg-bg-card shadow-md">
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-10 w-10 items-center justify-center border-b border-border-light text-text-secondary transition-colors hover:bg-bg-secondary"
              title="Zoom in"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-bg-secondary"
              title="Zoom out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
              </svg>
            </button>
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
