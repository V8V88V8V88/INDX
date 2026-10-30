"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { states } from "@/data/india";
import { usePlaceNames } from "@/hooks/usePlaceNames";
import { fetchDistrictsFromAPI } from "@/lib/api";
import { districtPath } from "@/lib/districts";
import type { City, District, State } from "@/types";

export type SearchResultType = "page" | "state" | "city" | "district";

export interface PlaceResult {
  type: Exclude<SearchResultType, "page">;
  id: string;
  name: string;
  stateName: string;
  state: State;
  city?: City;
  district?: District;
  path: string;
}

export interface PageResult {
  type: "page";
  id: string;
  name: string;
  stateName?: undefined;
  state?: undefined;
  path: string;
}

export type SearchResult = PlaceResult | PageResult;

const typeOrder: Record<SearchResultType, number> = { page: 0, state: 1, city: 2, district: 3 };

const pages = [{ id: "map", keywords: ["india map", "map", "full map"], path: "/map" }] as const;

type Names = ReturnType<typeof usePlaceNames>;

function matches(term: string, ...names: string[]) {
  return names.some((name) => name.toLowerCase().includes(term));
}

function useDistrictsFor(term: string, { stateName, placeName }: Names) {
  const wantedStateIds = useMemo(() => {
    if (term.length < 2) return new Set<string>();
    const candidates = states.filter(
      (state) =>
        matches(term, state.name, stateName(state.id, state.name)) ||
        state.code.toLowerCase() === term ||
        state.cities.some((city) => matches(term, city.name, placeName(state.id, city.name))),
    );
    if (candidates.length > 0) return new Set(candidates.slice(0, 6).map((s) => s.id));
    return term.length >= 3 ? new Set(states.map((s) => s.id)) : new Set<string>();
  }, [term, stateName, placeName]);

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

export function useSearch({ includePages = false, initialQuery = "" } = {}) {
  const [query, setQueryState] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const term = query.toLowerCase().trim();
  const names = usePlaceNames();
  const { stateName, placeName } = names;
  const t = useTranslations("Search.pages");
  const districtsByState = useDistrictsFor(term, names);

  const results = useMemo<SearchResult[]>(() => {
    if (!term) return [];
    const found: SearchResult[] = includePages
      ? pages
          .filter((page) => page.keywords.some((k) => k.includes(term) || term.includes(k)) || matches(term, t(page.id)))
          .map((page): PageResult => ({ type: "page", id: page.id, name: t(page.id), path: page.path }))
      : [];

    for (const state of states) {
      const localState = stateName(state.id, state.name);
      if (matches(term, state.name, localState) || state.code.toLowerCase() === term) {
        found.push({ type: "state", id: state.id, name: localState, stateName: localState, state, path: `/state/${state.id}` });
      }
      for (const city of state.cities) {
        const localCity = placeName(state.id, city.name);
        if (matches(term, city.name, localCity)) {
          found.push({
            type: "city",
            id: city.id,
            name: localCity,
            stateName: localState,
            state,
            city,
            path: `/state/${state.id}#city-${city.id}`,
          });
        }
      }
      for (const district of districtsByState.get(state.id) ?? []) {
        const localDistrict = placeName(state.id, district.name);
        if (matches(term, district.name, localDistrict)) {
          found.push({
            type: "district",
            id: district.id || district.name,
            name: localDistrict,
            stateName: localState,
            state,
            district,
            path: districtPath(state.id, district.name),
          });
        }
      }
    }

    return found.sort((a, b) => {
      const exactA = a.name.toLowerCase() === term;
      const exactB = b.name.toLowerCase() === term;
      if (exactA !== exactB) return exactA ? -1 : 1;
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
      return a.name.localeCompare(b.name);
    });
  }, [term, districtsByState, includePages, stateName, placeName, t]);

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
