"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearch, type SearchResult } from "@/hooks/useSearch";
import { SearchInput, SearchResults } from "./SearchResults";

interface InlineSearchProps {
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  onClear?: () => void;
  defaultValue?: string;
}

export function InlineSearch({ placeholder, onSelect, onClear, defaultValue }: InlineSearchProps) {
  const { query, setQuery, results, activeIndex, handleKeyDown } = useSearch({ initialQuery: defaultValue });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (result: SearchResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onSelect(result);
  };

  const showResults = isOpen && !!query.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchInput
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          setIsOpen(true);
        }}
        onClear={() => {
          setQuery("");
          onClear?.();
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            return;
          }
          setIsOpen(true);
          handleKeyDown(e, select);
        }}
        placeholder={placeholder}
        listboxId={listboxId}
        activeOptionId={`${listboxId}-${activeIndex}`}
        expanded={showResults && results.length > 0}
        className="rounded-full border border-border-light bg-bg-card shadow-sm transition-colors focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/20"
      />

      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border-light bg-bg-card shadow-xl"
        >
          <SearchResults
            query={query}
            results={results}
            activeIndex={activeIndex}
            listboxId={listboxId}
            onSelect={select}
          />
        </motion.div>
      )}
    </div>
  );
}
