"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import type { SearchResult } from "@/hooks/useSearch";
import { cn } from "@/lib/cn";
import { Icon, Kbd } from "./ui";

const typeLabel = { state: "State", city: "City", district: "District" };

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  listboxId: string;
  activeOptionId?: string;
  expanded: boolean;
  trailing?: ReactNode;
  className?: string;
}

export function SearchInput({
  value,
  onValueChange,
  onClear,
  listboxId,
  activeOptionId,
  expanded,
  trailing,
  className,
  placeholder = "Search states, cities, or districts...",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", className)}>
      <Icon name="search" size={18} className="shrink-0 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={expanded ? activeOptionId : undefined}
        className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
          aria-label="Clear search"
        >
          <Icon name="close" />
        </button>
      )}
      {trailing}
    </div>
  );
}

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  activeIndex: number;
  listboxId: string;
  onSelect: (result: SearchResult) => void;
}

export function SearchResults({ query, results, activeIndex, listboxId, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-text-tertiary">No results found for &quot;{query}&quot;</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto py-1" id={listboxId} role="listbox" aria-label="Search results">
        {results.map((result, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={`${result.type}-${result.id}`}
              id={`${listboxId}-${index}`}
              type="button"
              role="option"
              aria-selected={active}
              tabIndex={-1}
              onClick={() => onSelect(result)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                active ? "bg-accent-primary/10" : "hover:bg-bg-secondary",
              )}
            >
              <Icon
                name={result.type}
                size={18}
                className={cn("shrink-0", active ? "text-accent-primary" : "text-text-muted")}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate font-medium", active ? "text-accent-primary" : "text-text-primary")}>
                  {result.name}
                </span>
                {result.type !== "state" && (
                  <span className="mt-0.5 block truncate text-xs text-text-muted">{result.state.name}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-text-muted">{typeLabel[result.type]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border-light px-4 py-2 text-xs text-text-muted">
        <span>
          {results.length} {results.length === 1 ? "result" : "results"}
        </span>
        <div className="hidden items-center gap-4 sm:flex">
          <span>
            <Kbd>↑↓</Kbd> navigate
          </span>
          <span>
            <Kbd>↵</Kbd> select
          </span>
        </div>
      </div>
    </>
  );
}
