"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { states } from "@/data/india";
import type { State, District } from "@/types";
import { fetchDistrictsFromAPI } from "@/lib/api";

interface SearchResult {
  type: "state" | "city" | "district";
  id: string;
  name: string;
  stateName?: string;
  stateId?: string;
  path: string;
}

let openSpotlightFn: (() => void) | null = null;

// State code shortcuts (e.g., "up" -> "Uttar Pradesh")
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

export function Spotlight() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [districtsCache, setDistrictsCache] = useState<Map<string, District[]>>(new Map());
  const router = useRouter();

  useEffect(() => {
    openSpotlightFn = () => setIsOpen(true);
    return () => {
      openSpotlightFn = null;
    };
  }, []);

  useEffect(() => {
    const fetchAllDistricts = async () => {
      const cache = new Map<string, District[]>();
      await Promise.all(
        states.map(async (state) => {
          try {
            const districts = await fetchDistrictsFromAPI(state.id);
                  cache.set(state.id, districts);
                } catch (error) {
                }
        })
      );
      setDistrictsCache(cache);
    };
    fetchAllDistricts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search through states, cities, and districts
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
          path: `/state/${state.id}`,
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
          path: `/state/${state.id}`,
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
            path: `/state/${state.id}#city-${city.id}`,
          });
        }
      });

      // Search districts within state
      const districts = districtsCache.get(state.id) || [];
      districts.forEach((district) => {
        if (district.name.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: "district",
            id: district.id || district.name,
            name: district.name,
            stateName: state.name,
            stateId: state.id,
            path: `/state/${state.id}#district-${encodeURIComponent(district.name)}`,
          });
        }
      });
    });

    return matches.sort((a, b) => {
      const typeOrder = { state: 0, city: 1, district: 2 };
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
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
    if (!isOpen || results.length === 0) return;

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
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    
    // If the path has a hash and we're navigating to the same page, update hash directly
    if (result.path.includes("#") && window.location.pathname === result.path.split("#")[0]) {
      window.location.hash = result.path.split("#")[1];
      // Trigger hashchange event manually for same-page navigation
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
    router.push(result.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Spotlight Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="mx-4 rounded-xl border border-border-light bg-bg-card shadow-xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5">
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
                  placeholder="Search states, cities, or districts..."
                  className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex-shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-secondary transition-colors"
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <kbd className="hidden rounded-md bg-bg-secondary px-2 py-1 text-xs font-mono text-text-muted sm:inline-flex items-center gap-1">
                  <span>ESC</span>
                </kbd>
              </div>

              {query.trim() && (
                <div className="border-t border-border-light max-h-96 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-sm text-text-tertiary">No results found for &quot;{query}&quot;</p>
                  </div>
                ) : (
                    <>
                      <div className="py-1">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                            className={`w-full px-4 py-2.5 text-left transition-colors ${
                          index === selectedIndex
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
                            ) : result.type === "city" ? (
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
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function openSpotlight() {
  if (openSpotlightFn) {
    openSpotlightFn();
  }
}
