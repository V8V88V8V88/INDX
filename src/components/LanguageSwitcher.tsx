"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { Button, Icon } from "./ui";

export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  return (locale: Locale) =>
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale, scroll: false });
}

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  const [open, setOpen] = useState(false);

  if (LOCALES.length < 2) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        pressed={open}
        onClick={() => setOpen((o) => !o)}
        aria-label={t("language")}
        title={t("language")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="languages" size={18} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label={t("language")}
            className="absolute right-0 top-full mt-2 max-h-[70vh] w-44 overflow-y-auto rounded-2xl border border-border-light bg-bg-card/95 p-1 shadow-lg backdrop-blur-md"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          >
            {LOCALES.map((option) => (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={locale === option.code}
                lang={option.code}
                onClick={() => {
                  setOpen(false);
                  changeLocale(option.code);
                }}
                className={cn(
                  "block w-full rounded-xl px-3 py-1.5 text-left text-sm transition-colors",
                  locale === option.code
                    ? "bg-accent-primary text-white"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
