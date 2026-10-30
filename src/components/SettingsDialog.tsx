"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { SettingsContent } from "./SettingsPanel";
import { Button, Icon } from "./ui";

let openSettingsFn: (() => void) | null = null;

export function openSettings() {
  openSettingsFn?.();
}

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Settings");
  const tCommon = useTranslations("Common");
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    openSettingsFn = () => setIsOpen(true);
    return () => {
      openSettingsFn = null;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [isOpen]);

  const fade = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={fade}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(85vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-light bg-bg-card shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-light py-3 pl-6 pr-3">
              <h2 id={titleId} className="text-lg font-semibold text-text-primary">
                {t("title")}
              </h2>
              <Button ref={closeRef} variant="ghost" size="sm" iconOnly onClick={() => setIsOpen(false)} aria-label={tCommon("close")}>
                <Icon name="close" />
              </Button>
            </div>
            <div className="overflow-y-auto p-6">
              <SettingsContent />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
