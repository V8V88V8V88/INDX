"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { SearchResult } from "@/hooks/useSearch";
import { cn } from "@/lib/cn";
import { Icon, Kbd } from "./ui";

const typeIcon = { page: "globe", state: "state", city: "city", district: "district" } as const;

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
  placeholder,
  ...props
}: SearchInputProps) {
  const t = useTranslations("Search");
  const label = placeholder ?? t("placeholder");

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", className)}>
      <Icon name="search" size={18} className="shrink-0 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={label}
        aria-label={label}
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
          aria-label={t("clear")}
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
  const t = useTranslations("Search");

  if (results.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-text-tertiary">{t("noResults", { query })}</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto py-1" id={listboxId} role="listbox" aria-label={t("results")}>
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
                name={typeIcon[result.type]}
                size={18}
                className={cn("shrink-0", active ? "text-accent-primary" : "text-text-muted")}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate font-medium", active ? "text-accent-primary" : "text-text-primary")}>
                  {result.name}
                </span>
                {result.state && result.type !== "state" && (
                  <span className="mt-0.5 block truncate text-xs text-text-muted">{result.stateName}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-text-muted">{t(`type.${result.type}`)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border-light px-4 py-2 text-xs text-text-muted">
        <span>{t("count", { count: results.length })}</span>
        <div className="hidden items-center gap-4 sm:flex">
          <span>
            <Kbd>↑↓</Kbd> {t("navigate")}
          </span>
          <span>
            <Kbd>↵</Kbd> {t("select")}
          </span>
        </div>
      </div>
    </>
  );
}
