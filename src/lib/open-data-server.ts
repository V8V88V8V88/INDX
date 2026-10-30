import { readFile } from "node:fs/promises";
import path from "node:path";
import { districtFileName, prepareDistricts } from "./api";
import type { District } from "@/types";

export async function readDistricts(stateCode: string): Promise<District[]> {
  const file = path.join(process.cwd(), "public", "data", "districts", `${districtFileName(stateCode)}.json`);
  return prepareDistricts(stateCode, JSON.parse(await readFile(file, "utf8")));
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

export function json(data: unknown) {
  return Response.json(data, { headers });
}

export function csv(body: string, filename: string) {
  return new Response(body, {
    headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `inline; filename="${filename}"` },
  });
}
