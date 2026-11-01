import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { states } from "../src/data/india";
import type {
  Scheme,
  SchemeCategory,
  SchemeStatus,
  SchemeSummary,
} from "../src/types/index";

const SCHEMES_DIR = path.join(process.cwd(), "public", "data", "schemes");
const INDEX_FILE = path.join(SCHEMES_DIR, "index.json");

const SCOPES = ["central", "state", "Union Territories"] as const;
const STATUSES: SchemeStatus[] = [
  "active",
  "closed",
  "merged",
  "replaced",
  "renamed",
  "discontinued",
];
const CATEGORIES: SchemeCategory[] = [
  "education",
  "healthcare",
  "employment",
  "agriculture",
  "women-child",
  "financial-inclusion",
  "housing",
  "social-security",
  "msme",
  "rural-development",
  "urban-development",
  "infrastructure",
  "scholarships",
  "senior-citizens",
  "sc-st-obc",
  "state-welfare",
];

const VALID_STATE_IDS = new Set(states.map((s) => s.id));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENT_YEAR = new Date().getFullYear();

type Issue = { file: string; id?: string; message: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validateScheme(
  file: string,
  index: number,
  raw: unknown,
  issues: Issue[],
): raw is Scheme {
  const where = `${file}[${index}]`;
  if (typeof raw !== "object" || raw === null) {
    issues.push({ file, message: `${where}: entry is not an object` });
    return false;
  }
  const s = raw as Record<string, unknown>;
  const id = isNonEmptyString(s.id) ? s.id : undefined;
  const note = (message: string) => issues.push({ file, id, message: `${where}: ${message}` });

  if (!id || !SLUG.test(id)) note(`invalid or missing id "${String(s.id)}" (must be a lowercase slug)`);

  for (const key of ["name", "government", "objectives", "lastUpdated"] as const) {
    if (!isNonEmptyString(s[key])) note(`missing required text field "${key}"`);
  }

  if (!SCOPES.includes(s.scope as (typeof SCOPES)[number])) {
    note(`invalid scope "${String(s.scope)}"`);
  } else if (s.scope === "state" || s.scope === "Union Territories") {
    if (!isNonEmptyString(s.stateId) || !VALID_STATE_IDS.has(s.stateId)) {
      note(`scope "${s.scope}" requires a valid stateId (got "${String(s.stateId)}")`);
    }
  } else if (isNonEmptyString(s.stateId)) {
    note(`scope "central" must not set stateId`);
  }

  if (!STATUSES.includes(s.status as SchemeStatus)) {
    note(`invalid status "${String(s.status)}"`);
  } else if (s.status === "renamed" && !isNonEmptyString(s.renamedTo)) {
    note(`status "renamed" requires renamedTo`);
  } else if (
    (s.status === "merged" || s.status === "replaced") &&
    !(Array.isArray(s.supersededBy) && s.supersededBy.length > 0)
  ) {
    note(`status "${s.status}" requires a non-empty supersededBy`);
  }

  if (
    typeof s.launchYear !== "number" ||
    s.launchYear < 1900 ||
    s.launchYear > CURRENT_YEAR + 1
  ) {
    note(`launchYear must be a number between 1900 and ${CURRENT_YEAR + 1}`);
  }

  if (!Array.isArray(s.categories) || s.categories.length === 0) {
    note(`at least one category is required`);
  } else {
    for (const c of s.categories) {
      if (!CATEGORIES.includes(c as SchemeCategory)) note(`unknown category "${String(c)}"`);
    }
  }

  for (const key of ["targetBeneficiaries", "eligibility", "benefits", "application", "officialUrls", "sources"] as const) {
    if (!Array.isArray(s[key]) || (s[key] as unknown[]).length === 0) {
      note(`"${key}" must be a non-empty array`);
    }
  }

  if (Array.isArray(s.sources)) {
    const ok = (s.sources as unknown[]).some(
      (src) =>
        typeof src === "object" &&
        src !== null &&
        isNonEmptyString((src as Record<string, unknown>).url) &&
        /^https?:\/\//.test((src as Record<string, unknown>).url as string),
    );
    if (!ok) note(`at least one source with an http(s) URL is required`);
  }

  return issues.every((i) => i.file !== file || !i.message.startsWith(where));
}

function toSummary(s: Scheme, file: string): SchemeSummary {
  return {
    id: s.id,
    name: s.name,
    aliases: s.aliases,
    scope: s.scope,
    stateId: s.stateId,
    government: s.government,
    ministry: s.ministry,
    categories: s.categories,
    launchYear: s.launchYear,
    status: s.status,
    officialUrl: s.officialUrls[0],
    file,
  };
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const entries = await readdir(SCHEMES_DIR);
  const dataFiles = entries.filter((f) => f.endsWith(".json") && f !== "index.json");

  const issues: Issue[] = [];
  const seenIds = new Map<string, string>();
  const summaries: SchemeSummary[] = [];

  for (const file of dataFiles.sort()) {
    const raw = JSON.parse(await readFile(path.join(SCHEMES_DIR, file), "utf8"));
    if (!Array.isArray(raw)) {
      issues.push({ file, message: "file must contain a JSON array of schemes" });
      continue;
    }
    raw.forEach((entry, i) => {
      if (!validateScheme(file, i, entry, issues)) return;
      const scheme = entry as Scheme;
      const duplicate = seenIds.get(scheme.id);
      if (duplicate) {
        issues.push({ file, id: scheme.id, message: `duplicate id "${scheme.id}" (also in ${duplicate})` });
      } else {
        seenIds.set(scheme.id, file);
        summaries.push(toSummary(scheme, file.replace(/\.json$/, "")));
      }
    });
  }

  summaries.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope === "central" ? -1 : 1;
    if (a.stateId !== b.stateId) return (a.stateId || "").localeCompare(b.stateId || "");
    return a.name.localeCompare(b.name);
  });

  if (issues.length > 0) {
    console.error(`Found ${issues.length} scheme issue(s):`);
    for (const i of issues) console.error(`  ${i.id ? `[${i.id}] ` : ""}${i.message}`);
    process.exit(1);
  }

  console.log(`OK: ${summaries.length} scheme(s) across ${dataFiles.length} file(s).`);

  if (checkOnly) return;
  await writeFile(INDEX_FILE, JSON.stringify(summaries, null, 2) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), INDEX_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
