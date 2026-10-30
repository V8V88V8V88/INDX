import { defineRouting } from "next-intl/routing";

export const LOCALES = [
  { code: "en", name: "English" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const routing = defineRouting({
  locales: LOCALES.map((l) => l.code),
  defaultLocale: "en",
  localePrefix: "as-needed",
});
