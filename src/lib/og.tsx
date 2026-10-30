import { readFile } from "node:fs/promises";
import path from "node:path";
import * as d3 from "d3";
import { rewindForD3 } from "./map-projection";

export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#0a0a0a";
const ACCENT = "#14b8a6";
const MUTED = "#a1a1aa";

async function googleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const source = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!source) throw new Error(`No font file for ${family}`);
  return (await fetch(source)).arrayBuffer();
}

export async function ogFonts(text: string) {
  return [
    { name: "Inter", data: await googleFont("Inter", 400, text), weight: 400 as const },
    { name: "Inter", data: await googleFont("Inter", 700, text), weight: 700 as const },
  ];
}

function decimate(minDistance: number): d3.GeoStreamWrapper {
  return {
    stream(output) {
      let lastX = 0;
      let lastY = 0;
      let first = true;
      return {
        point(x, y) {
          if (first || Math.hypot(x - lastX, y - lastY) >= minDistance) {
            output.point(x, y);
            lastX = x;
            lastY = y;
            first = false;
          }
        },
        lineStart() {
          first = true;
          output.lineStart();
        },
        lineEnd() {
          output.lineEnd();
        },
        polygonStart() {
          output.polygonStart();
        },
        polygonEnd() {
          output.polygonEnd();
        },
        sphere() {
          output.sphere?.();
        },
      };
    },
  };
}

export async function shapePath(file: string, size: number) {
  const geo = JSON.parse(await readFile(path.join(process.cwd(), "public", file), "utf8")) as GeoJSON.FeatureCollection;
  const features = {
    ...geo,
    features: geo.features
      .filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
      .map((f) => rewindForD3(f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)),
  };
  const projection = d3.geoMercator().fitSize([size, size], features);
  const simplify = decimate(1.2);
  const pathFor = d3.geoPath({ stream: (s) => projection.stream(simplify.stream(s)) }).digits(1);
  return features.features.map((f) => pathFor(f) ?? "").filter(Boolean);
}

export function OgCard({ title, subtitle, stats, paths }: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  paths: string[];
}) {
  const shapeSize = 500;

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: BG, color: "#fafafa", fontFamily: "Inter", padding: 64 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>
          INDX
          <div style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT, marginLeft: 8 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 22 ? 56 : 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>{title}</div>
          <div style={{ fontSize: 28, color: MUTED, marginTop: 16 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex" }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", marginRight: 56 }}>
              <div style={{ fontSize: 22, color: MUTED }}>{stat.label}</div>
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 6 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: shapeSize }}>
        <svg width={shapeSize} height={shapeSize} viewBox={`0 0 ${shapeSize} ${shapeSize}`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill={ACCENT} stroke={BG} strokeWidth={0.8} strokeLinejoin="round" />
          ))}
        </svg>
      </div>
    </div>
  );
}

export function ogText(...parts: string[]) {
  return parts.join(" ") + " INDX0123456789.,·#%&()+-/";
}
