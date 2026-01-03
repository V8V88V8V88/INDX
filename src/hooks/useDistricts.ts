"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDistrictsFromAPI } from "@/lib/api";
import type { District } from "@/types";

export function useDistricts(stateCode: string) {
  return useQuery<District[]>({
    queryKey: ["districts", stateCode],
    queryFn: () => fetchDistrictsFromAPI(stateCode),
    enabled: Boolean(stateCode),
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

