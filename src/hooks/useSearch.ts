"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { states } from "@/data/india";
import { fetchDistrictsFromAPI } from "@/lib/api";
import type { City, District, State } from "@/types";

export type SearchResultType = "state" | "city" | "district";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  state: State;
  city?: City;
  district?: District;
  path: string;
}

const typeOrder: Record<SearchResultType, number> = { state: 0, city: 1, district: 2 };

function useDistrictsFor(term: string) {
  const wantedStateIds = useMemo(() => {
    if (term.length < 2) return new Set<string>();
    const candidates = states.filter(
      (state) =>
        state.name.toLowerCase().includes(term) ||
        state.code.toLowerCase() === term ||
        state.cities.some((city) => city.name.toLowerCase().includes(term)),
    );
    if (candidates.length > 0) return new Set(candidates.slice(0, 6).map((s) => s.id));
    return term.length >= 3 ? new Set(states.map((s) => s.id)) : new Set<string>();
  }, [term]);

  return useQueries({
    queries: states.map((state) => ({
      queryKey: ["districts", state.id],
      queryFn: () => fetchDistrictsFromAPI(state.id),
      enabled: wantedStateIds.has(state.id),
      staleTime: 5 * 60 * 1000,
    })),
    combine: (queryResults) =>
      new Map<string, District[]>(states.map((state, i) => [state.id, queryResults[i]?.data ?? []])),
  });
}

export function useSearch() {
  const [query, setQueryState] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const term = query.toLowerCase().trim();
  const districtsByState = useDistrictsFor(term);

  const results = useMemo<SearchResult[]>(() => {
    if (!term) return [];
    const matches: SearchResult[] = [];

    for (const state of states) {
      if (state.name.toLowerCase().includes(term) || state.code.toLowerCase() === term) {
        matches.push({ type: "state", id: state.id, name: state.name, state, path: `/state/${state.id}` });
      }
      for (const city of state.cities) {
        if (city.name.toLowerCase().includes(term)) {
          matches.push({
            type: "city",
            id: city.id,
            name: city.name,
            state,
            city,
            path: `/state/${state.id}#city-${city.id}`,
          });
        }
      }
      for (const district of districtsByState.get(state.id) ?? []) {
        if (district.name.toLowerCase().includes(term)) {
          matches.push({
            type: "district",
            id: district.id || district.name,
            name: district.name,
            state,
            district,
            path: `/state/${state.id}#district-${encodeURIComponent(district.name)}`,
          });
        }
      }
    }

    return matches.sort((a, b) => {
      const exactA = a.name.toLowerCase() === term;
      const exactB = b.name.toLowerCase() === term;
      if (exactA !== exactB) return exactA ? -1 : 1;
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
      return a.name.localeCompare(b.name);
    });
  }, [term, districtsByState]);

  const activeIndex = Math.min(selectedIndex, Math.max(results.length - 1, 0));

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, onSelect: (result: SearchResult) => void) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((activeIndex + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(results[activeIndex]);
    }
  };

  return { query, setQuery, results, activeIndex, handleKeyDown };
}
