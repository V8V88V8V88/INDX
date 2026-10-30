"use client";

import { useTranslations } from "next-intl";
import { Icon, buttonStyles } from "./ui";

export function DownloadCsv({ href, variant = "ghost" }: { href: string; variant?: "ghost" | "secondary" }) {
  const t = useTranslations("Common");

  return (
    <a href={href} download title={t("downloadCsv")} aria-label={t("downloadCsv")} className={buttonStyles({ variant, size: "sm", iconOnly: true })}>
      <Icon name="download" size={14} />
    </a>
  );
}
