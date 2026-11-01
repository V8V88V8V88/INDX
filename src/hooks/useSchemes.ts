"use client";

import { useQuery } from "@tanstack/react-query";
import type { Scheme, SchemeSummary } from "@/types/index";

const INDEX_URL = "/data/schemes/index.json";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Lightweight list of every scheme, used for listing, filtering and search. */
export function useSchemeIndex() {
  return useQuery<SchemeSummary[]>({
    queryKey: ["schemes", "index"],
    queryFn: () => fetchJson<SchemeSummary[]>(INDEX_URL),
    staleTime: 30 * 60 * 1000,
  });
}

/** Full record for a single scheme, located via the index and loaded from its file. */
export function useScheme(id: string) {
  return useQuery<Scheme | null>({
    queryKey: ["schemes", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const index = await fetchJson<SchemeSummary[]>(INDEX_URL);
      const summary = index.find((s) => s.id === id);
      if (!summary) return null;
      const records = await fetchJson<Scheme[]>(`/data/schemes/${summary.file}.json`);
      return records.find((s) => s.id === id) ?? null;
    },
    staleTime: 30 * 60 * 1000,
  });
}
