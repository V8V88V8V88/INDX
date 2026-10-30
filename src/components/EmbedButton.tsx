"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { SITE_URL } from "@/lib/site";
import { Button, Icon } from "./ui";

interface EmbedButtonProps {
  path: string;
  query: Record<string, string>;
  title: string;
  align?: "left" | "right";
}

export function EmbedButton({ path, query, title, align = "right" }: EmbedButtonProps) {
  const t = useTranslations("Embed");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const src = `${SITE_URL}${getPathname({ href: path, locale })}?${new URLSearchParams(query)}`;
  const code = `<iframe src="${src}" title="${title.replace(/"/g, "&quot;")}" width="100%" height="640" style="border:0" loading="lazy"></iframe>`;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="overlay"
        size="sm"
        iconOnly
        pressed={open}
        onClick={() => setOpen((o) => !o)}
        title={t("button")}
        aria-label={t("button")}
        aria-expanded={open}
      >
        <Icon name="code" size={14} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label={t("button")}
            className={cn(
              "absolute top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-light bg-bg-card/95 p-3 shadow-lg backdrop-blur-md",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            <p className="mb-2 text-xs text-text-secondary">{t("hint")}</p>
            <textarea
              readOnly
              value={code}
              rows={4}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full resize-none rounded-lg bg-bg-secondary p-2 font-mono text-[11px] leading-relaxed text-text-primary focus:outline-none"
            />
            <Button size="sm" className="mt-2" onClick={copy}>
              <Icon name={copied ? "check" : "code"} size={14} />
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
