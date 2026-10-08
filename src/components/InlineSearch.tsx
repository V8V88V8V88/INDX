"use client";

import { useState, useEffect, useMemo, useRef, useId } from "react";
import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { states } from "@/data/india";
import type { State, District } from "@/types";
import { fetchDistrictsFromAPI } from "@/lib/api";

interface SearchResult {
  type: "state" | "city" | "district";
  id: string;
  name: string;
  stateName?: string;
  stateId?: string;
  state?: State;
  city?: import("@/types").City;
  district?: District;
}

interface InlineSearchProps {
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  selectedState?: State | null;
}

export function InlineSearch({ placeholder = "Search states, cities, or districts...", onSelect, selectedState }: InlineSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [prevSelectedState, setPrevSelectedState] = useState(selectedState);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Mirror an externally selected state into the input (adjusting state during render
  // instead of in an effect)
  if (selectedState !== prevSelectedState) {
    setPrevSelectedState(selectedState);
    if (selectedState) setQuery(selectedState.name);
  }

  // Lazy-load districts only for states that are likely relevant to the current query.
  // Data lives in the shared React Query cache, so it stays available once fetched.
  const searchTerm = query.toLowerCase().trim();
  const wantedStateIds = useMemo(() => {
    if (searchTerm.length < 2) return new Set<string>();
    const candidates = states.filter(
      (state) =>
        state.name.toLowerCase().includes(searchTerm) ||
        state.code.toLowerCase() === searchTerm ||
        state.cities.some((city) => city.name.toLowerCase().includes(searchTerm)),
    );
    if (candidates.length > 0) return new Set(candidates.slice(0, 6).map((s) => s.id));
    // Nothing obvious: search every state's districts (the files are small)
    return searchTerm.length >= 3 ? new Set(states.map((s) => s.id)) : new Set<string>();
  }, [searchTerm]);

  const districtsCache = useQueries({
    queries: states.map((state) => ({
      queryKey: ["districts", state.id],
      queryFn: () => fetchDistrictsFromAPI(state.id),
      enabled: wantedStateIds.has(state.id),
      staleTime: 5 * 60 * 1000,
    })),
    combine: (queryResults) =>
      new Map<string, District[]>(states.map((state, i) => [state.id, queryResults[i]?.data ?? []])),
  });

  const results = useMemo<SearchResult[]>(() => {
    if (!searchTerm) return [];

    const matches: SearchResult[] = [];


    states.forEach((state) => {
      if (state.name.toLowerCase().includes(searchTerm) || state.code.toLowerCase() === searchTerm) {
        matches.push({
          type: "state",
          id: state.id,
          name: state.name,
          state: state,
        });
      }

      state.cities.forEach((city) => {
        if (city.name.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: "city",
            id: city.id,
            name: city.name,
            stateName: state.name,
            stateId: state.id,
            state: state,
            city: city,
          });
        }
      });

      const districts = districtsCache.get(state.id) || [];
      districts.forEach((district) => {
        if (district.name.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: "district",
            id: district.id || district.name,
            name: district.name,
            stateName: state.name,
            stateId: state.id,
            state: state,
            district: district,
          });
        }
      });
    });

    return matches.sort((a, b) => {
      const typeOrder = { state: 0, city: 1, district: 2 };
      if (a.type !== b.type) {
        const exactMatchA = a.name.toLowerCase() === searchTerm;
        const exactMatchB = b.name.toLowerCase() === searchTerm;
        if (exactMatchA && !exactMatchB) return -1;
        if (exactMatchB && !exactMatchA) return 1;
        return typeOrder[a.type] - typeOrder[b.type];
      }
      const exactMatchA = a.name.toLowerCase() === searchTerm;
      const exactMatchB = b.name.toLowerCase() === searchTerm;
      if (exactMatchA && !exactMatchB) return -1;
      if (exactMatchB && !exactMatchA) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchTerm, districtsCache]);

  const activeIndex = Math.min(selectedIndex, Math.max(results.length - 1, 0));

  const changeQuery = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setIsFocused(false);
    setSelectedIndex(0);
    onSelect(result);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsFocused(true);
      setSelectedIndex((activeIndex + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-bg-card px-4 py-3.5 shadow-sm transition-all focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/20">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted flex-shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            role="combobox"
            aria-expanded={isFocused && results.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={isFocused && results.length > 0 ? `${listboxId}-${activeIndex}` : undefined}
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                changeQuery("");
                onSelect({ type: "state", id: "", name: "", state: undefined });
              }}
              className="flex-shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-secondary transition-colors"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {isFocused && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border-light bg-bg-card shadow-xl overflow-hidden"
          >
            {results.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-text-tertiary">No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto py-1" id={listboxId} role="listbox">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      id={`${listboxId}-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      tabIndex={-1}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-2.5 text-left transition-colors ${index === activeIndex
                          ? "bg-accent-primary/10"
                          : "hover:bg-bg-secondary"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.type === "state" ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary/15 flex-shrink-0">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-accent-primary"
                            >
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-secondary/15 flex-shrink-0">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-accent-secondary"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${index === activeIndex ? "text-accent-primary" : "text-text-primary"}`}>
                            {result.name}
                          </div>
                          {result.stateName && (
                            <div className="text-xs text-text-muted mt-0.5 truncate">
                              {result.stateName}
                            </div>
                          )}
                        </div>
                        {result.type === "state" && (
                          <span className="text-xs text-text-muted flex-shrink-0">State</span>
                        )}
                        {result.type === "city" && (
                          <span className="text-xs text-text-muted flex-shrink-0">City</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border-light px-4 py-2 text-xs text-text-muted">
                  <div className="flex items-center justify-between">
                    <span>
                      {results.length} {results.length === 1 ? "result" : "results"}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline">
                        <kbd className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
                      </span>
                      <span className="hidden sm:inline">
                        <kbd className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono">↵</kbd> select
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

