import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type District = {
  id: string;
  name: string;
  stateId: string;
  population: number;
  area: number;
  density: number;
  literacyRate: number;
  sexRatio: number;
  headquarters?: string;
};

function normalizeKey(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .replace(/[’'".,()/]/g, "");
}

async function main() {
  const base = path.join(process.cwd(), "public", "data", "districts");
  const files = (await readdir(base)).filter((f) => f.endsWith(".json"));

  let issues = 0;

  for (const f of files) {
    const fp = path.join(base, f);
    const raw = await readFile(fp, "utf8");
    const districts = JSON.parse(raw) as District[];

    const byName = new Map<string, District[]>();
    for (const d of districts) {
      const k = normalizeKey(d.name || "");
      if (!k) continue;
      const arr = byName.get(k) || [];
      arr.push(d);
      byName.set(k, arr);
    }

    const dups = Array.from(byName.entries()).filter(([, arr]) => arr.length > 1);
    if (dups.length > 0) {
      issues += dups.length;
      console.log(`\n${f}:`);
      for (const [k, arr] of dups) {
        console.log(`  duplicate: "${k}" (${arr.length}) -> ${arr.map((d) => d.id).join(", ")}`);
      }
    }
  }

  if (issues > 0) {
    console.log(`\nFound ${issues} duplicate district-name groups.`);
    process.exit(1);
  }

  console.log("OK: no duplicate district names found.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


