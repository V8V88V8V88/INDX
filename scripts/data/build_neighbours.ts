import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { states } from "../../src/data/india";
import { districtFileName } from "../../src/lib/api";
import { findDistrictByName } from "../../src/lib/districts";
import type { District } from "../../src/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "src", "data", "neighbours.json");
const check = process.argv.includes("--check");

function vertexKeys(geometry: GeoJSON.Geometry | null): Set<string> {
  const keys = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value) && typeof value[0] === "number") keys.add(`${(value[0] as number).toFixed(3)},${(value[1] as number).toFixed(3)}`);
    else if (Array.isArray(value)) value.forEach(visit);
  };
  if (geometry && "coordinates" in geometry) visit(geometry.coordinates);
  return keys;
}

const stateIds = states.map((s) => s.id);
const result: Record<string, Record<string, string[]>> = {};

for (const stateId of stateIds) {
  const districts = JSON.parse(await readFile(path.join(root, "public", "data", "districts", `${districtFileName(stateId)}.json`), "utf8")) as District[];
  const geo = JSON.parse(await readFile(path.join(root, "public", "geo", "states", `${stateId}.json`), "utf8")) as GeoJSON.FeatureCollection;
  const shapes = geo.features.map((f) => ({ name: findDistrictByName(districts, String(f.properties?.district ?? ""))?.name, keys: vertexKeys(f.geometry) }));
  const byName = new Map<string, Set<string>>();
  for (const shape of shapes) {
    if (!shape.name) continue;
    const keys = byName.get(shape.name) ?? new Set<string>();
    shape.keys.forEach((k) => keys.add(k));
    byName.set(shape.name, keys);
  }
  result[stateId] = {};
  for (const [name, keys] of [...byName].sort(([a], [b]) => a.localeCompare(b))) {
    result[stateId][name] = [...byName]
      .filter(([other, otherKeys]) => other !== name && [...otherKeys].some((k) => keys.has(k)))
      .map(([other]) => other)
      .sort();
  }
}

const json = JSON.stringify(result, null, 1) + "\n";
if (check) {
  const current = await readFile(out, "utf8").catch(() => "");
  if (current !== json) {
    console.error("src/data/neighbours.json is out of date, run bun run build:neighbours");
    process.exit(1);
  }
  console.log("OK: neighbours are up to date.");
} else {
  await writeFile(out, json);
  const count = Object.values(result).reduce((sum, s) => sum + Object.keys(s).length, 0);
  console.log(`wrote neighbours for ${count} districts to src/data/neighbours.json`);
}
