"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations, type Messages } from "next-intl";
import { routing } from "@/i18n/routing";
import { placeNameKey } from "@/lib/place-names";

type NameTable = Record<string, Record<string, string>>;
type StateKey = keyof Messages["States"];

async function fetchNames(locale: string): Promise<NameTable> {
  const response = await fetch(`/data/names/${locale}.json`);
  if (!response.ok) throw new Error(`Failed to fetch place names: HTTP ${response.status}`);
  return response.json();
}

export function usePlaceNames() {
  const locale = useLocale();
  const tStates = useTranslations("States");
  const tCapitals = useTranslations("Capitals");
  const { data } = useQuery({
    queryKey: ["names", locale],
    queryFn: () => fetchNames(locale),
    enabled: locale !== routing.defaultLocale,
    staleTime: Infinity,
  });

  const stateName = (id: string, fallback?: string) =>
    tStates.has(id as StateKey) ? tStates(id as StateKey) : (fallback ?? id);

  const capitalName = (id: string, fallback: string) =>
    tCapitals.has(id as StateKey) ? tCapitals(id as StateKey) : fallback;

  const placeName = (stateId: string, name: string) => data?.[stateId]?.[placeNameKey(name)] ?? name;

  return { stateName, capitalName, placeName };
}
