"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { newIssueUrl } from "@/lib/site";
import { Link } from "@/i18n/navigation";
import { Button, Icon } from "./ui";

const VISIBLE_MS = 5000;

export function reportDataErrorUrl(place: string) {
  return newIssueUrl("data-error.yml", { title: `Data error: ${place}`, place, page: window.location.href });
}

export function SourcesInfo({ children, className, place }: { children: ReactNode; className?: string; place?: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Common");

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className={className}>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => setOpen((o) => !o)}
          title={t("dataSources")}
          aria-label={t("dataSources")}
          aria-expanded={open}
        >
          <Icon name="info" size={14} />
        </Button>
        {open && (
          <div
            role="status"
            className="absolute bottom-full right-0 z-20 mb-2 w-72 rounded-xl border border-border-light bg-bg-card/95 p-3 text-xs leading-relaxed text-text-secondary shadow-lg backdrop-blur-md"
          >
            {children}{" "}
            <Link href="/about" className="text-text-primary underline-offset-2 hover:underline">
              {t("allSources")}
            </Link>
            {place && (
              <a
                href={reportDataErrorUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-text-primary underline-offset-2 hover:underline"
              >
                <Icon name="flag" size={12} />
                {t("reportError")}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
