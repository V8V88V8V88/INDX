import type { SchemeCategory, SchemeStatus } from "@/types/index";

export const SCHEME_CATEGORY_ORDER: SchemeCategory[] = [
  "education",
  "healthcare",
  "employment",
  "agriculture",
  "women-child",
  "financial-inclusion",
  "housing",
  "social-security",
  "msme",
  "rural-development",
  "urban-development",
  "infrastructure",
  "scholarships",
  "senior-citizens",
  "sc-st-obc",
  "state-welfare",
];

export const SCHEME_STATUS_ORDER: SchemeStatus[] = [
  "active",
  "closed",
  "merged",
  "replaced",
  "renamed",
  "discontinued",
];

/** Tailwind classes for a status badge. */
export const SCHEME_STATUS_STYLES: Record<SchemeStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-bg-tertiary text-text-muted border-border-light",
  merged: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  replaced: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  renamed: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  discontinued: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};
