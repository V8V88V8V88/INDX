"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchGeo<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  return response.json();
}

export function useIndiaGeo<T>() {
  return useQuery({
    queryKey: ["geo", "india"],
    queryFn: () => fetchGeo<T>("/india-states.json"),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useStateGeo<T>(stateCode: string) {
  return useQuery({
    queryKey: ["geo", "state", stateCode],
    queryFn: () => fetchGeo<T>(`/geo/states/${stateCode}.json`),
    enabled: Boolean(stateCode),
    staleTime: Infinity,
    retry: 1,
  });
}
