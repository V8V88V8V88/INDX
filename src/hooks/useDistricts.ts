"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDistrictsFromAPI } from "@/lib/api";
import type { District } from "@/types";

export function useDistricts(stateCode: string) {
  return useQuery<District[]>({
    queryKey: ["districts", stateCode],
    queryFn: () => fetchDistrictsFromAPI(stateCode),
    enabled: Boolean(stateCode),
  });
}

