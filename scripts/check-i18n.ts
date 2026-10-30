import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type Messages = { [key: string]: string | Messages };

const dir = path.resolve("messages");
const reference = "en";

function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const id = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(id, value);
    else for (const [k, v] of flatten(value, id)) out.set(k, v);
  }
  return out;
}

function placeholders(message: string): string {
  return [...new Set([...message.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]))].sort().join(",");
}

async function load(locale: string) {
  return flatten(JSON.parse(await readFile(path.join(dir, `${locale}.json`), "utf8")));
}

const routing = await readFile(path.resolve("src/i18n/routing.ts"), "utf8");
const configured = [...routing.matchAll(/code: "([a-z-]+)"/g)].map((m) => m[1]);
const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
const base = await load(reference);
const problems: string[] = [];

for (const locale of configured) if (!files.includes(locale)) problems.push(`${locale}: listed in src/i18n/routing.ts but messages/${locale}.json is missing`);
for (const locale of files) if (!configured.includes(locale)) problems.push(`${locale}: messages/${locale}.json exists but isn't listed in src/i18n/routing.ts`);

for (const locale of files) {
  if (locale === reference) continue;
  const messages = await load(locale);
  for (const [key, value] of base) {
    const translated = messages.get(key);
    if (translated === undefined) problems.push(`${locale}: missing ${key}`);
    else if (!translated.trim()) problems.push(`${locale}: empty ${key}`);
    else if (placeholders(translated) !== placeholders(value))
      problems.push(`${locale}: ${key} uses {${placeholders(translated)}} but English uses {${placeholders(value)}}`);
  }
  for (const key of messages.keys()) if (!base.has(key)) problems.push(`${locale}: unknown key ${key}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}

console.log(`OK: ${files.length} locale(s), ${base.size} messages each.`);
