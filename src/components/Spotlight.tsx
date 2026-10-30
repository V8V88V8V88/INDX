"use client";

import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearch, type SearchResult } from "@/hooks/useSearch";
import { SearchInput, SearchResults } from "./SearchResults";
import { Kbd } from "./ui";

let openSpotlightFn: (() => void) | null = null;

export function openSpotlight() {
  openSpotlightFn?.();
}

export function Spotlight() {
  const [isOpen, setIsOpen] = useState(false);
  const { query, setQuery, results, activeIndex, handleKeyDown } = useSearch({ includePages: true });
  const router = useRouter();
  const currentPath = usePathname();
  const t = useTranslations("Nav");
  const listboxId = useId();

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    openSpotlightFn = () => setIsOpen(true);
    return () => {
      openSpotlightFn = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setQuery]);

  const select = (result: SearchResult) => {
    close();
    const [pathname, hash] = result.path.split("#");
    if (hash && currentPath === pathname) {
      window.location.hash = hash;
    } else {
      router.push(result.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-label={t("search")}
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-border-light bg-bg-card shadow-xl">
              <SearchInput
                value={query}
                onValueChange={setQuery}
                onClear={() => setQuery("")}
                onKeyDown={(e) => handleKeyDown(e, select)}
                listboxId={listboxId}
                activeOptionId={`${listboxId}-${activeIndex}`}
                expanded={results.length > 0}
                trailing={
                  <span className="hidden sm:inline-flex">
                    <Kbd>ESC</Kbd>
                  </span>
                }
                autoFocus
              />
              {query.trim() && (
                <div className="border-t border-border-light">
                  <SearchResults
                    query={query}
                    results={results}
                    activeIndex={activeIndex}
                    listboxId={listboxId}
                    onSelect={select}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
