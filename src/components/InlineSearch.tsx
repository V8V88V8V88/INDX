"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const stateCodeMap: Record<string, string> = {
  "up": "Uttar Pradesh",
  "mp": "Madhya Pradesh",
  "ap": "Andhra Pradesh",
  "tn": "Tamil Nadu",
  "mh": "Maharashtra",
  "br": "Bihar",
  "wb": "West Bengal",
  "gj": "Gujarat",
  "ka": "Karnataka",
  "or": "Odisha",
  "rj": "Rajasthan",
  "tg": "Telangana",
  "as": "Assam",
  "jh": "Jharkhand",
  "cg": "Chhattisgarh",
  "kl": "Kerala",
  "pb": "Punjab",
  "hr": "Haryana",
  "uk": "Uttarakhand",
  "hp": "Himachal Pradesh",
  "tr": "Tripura",
  "mn": "Manipur",
  "ml": "Meghalaya",
  "mz": "Mizoram",
  "nl": "Nagaland",
  "ar": "Arunachal Pradesh",
  "sk": "Sikkim",
  "go": "Goa",
  "dl": "Delhi",
  "jk": "Jammu & Kashmir",
  "la": "Ladakh",
  "an": "Andaman and Nicobar Islands",
  "ld": "Lakshadweep",
  "py": "Puducherry",
  "ch": "Chandigarh",
  "dd": "Dadra and Nagar Haveli and Daman and Diu",
};

interface InlineSearchProps {
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  selectedState?: State | null;
}

export function InlineSearch({ placeholder = "Search states, cities, or districts...", onSelect, selectedState }: InlineSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [districtsCache, setDistrictsCache] = useState<Map<string, District[]>>(new Map());
  const loadingStatesRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load districts only for states that are likely relevant to the current query,
  // instead of fetching all states on initial page load.
  useEffect(() => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm || searchTerm.length < 2) return;

    const candidateStates = states.filter((state) => {
      if (state.name.toLowerCase().includes(searchTerm)) return true;
      if (state.code.toLowerCase() === searchTerm) return true;
      return state.cities.some((city) => city.name.toLowerCase().includes(searchTerm));
    });

    let topCandidates = candidateStates.slice(0, 6);
    if (topCandidates.length === 0 && searchTerm.length >= 3) {
      const uncached = states.filter(
        (s) => !districtsCache.has(s.id) && !loadingStatesRef.current.has(s.id)
      );
      topCandidates = uncached.slice(0, 10);
    }

    if (topCandidates.length === 0) return;

    const toFetch = topCandidates
      .map((s) => s.id)
      .filter(
        (id) =>
          !districtsCache.has(id) && !loadingStatesRef.current.has(id),
      );

    if (toFetch.length === 0) return;

    toFetch.forEach((id) => loadingStatesRef.current.add(id));

    (async () => {
      const updates = new Map(districtsCache);
      for (const stateId of toFetch) {
        try {
          const districts = await fetchDistrictsFromAPI(stateId);
          updates.set(stateId, districts);
        } catch {
          // ignore individual fetch errors, we can try again on a future query
        } finally {
          loadingStatesRef.current.delete(stateId);
        }
      }
      setDistrictsCache(updates);
    })();
  }, [query, districtsCache]);

  useEffect(() => {
    if (selectedState) {
      setQuery(selectedState.name);
    }
  }, [selectedState]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    const stateCodeMatch = stateCodeMap[searchTerm];
    if (stateCodeMatch) {
      const state = states.find((s) => s.name === stateCodeMatch);
      if (state) {
        matches.push({
          type: "state",
          id: state.id,
          name: state.name,
          state: state,
        });
      }
    }

    states.forEach((state) => {
      if (stateCodeMatch && state.name === stateCodeMatch) return;

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
  }, [query, districtsCache]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (!query.trim()) {
      setSelectedIndex(0);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isFocused || results.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setIsFocused(false);
    setSelectedIndex(0);
    onSelect(result);
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
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
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
                <div className="max-h-96 overflow-y-auto py-1">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-2.5 text-left transition-colors ${index === selectedIndex
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
                          <div className={`font-medium truncate ${index === selectedIndex ? "text-accent-primary" : "text-text-primary"}`}>
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

