import type { Metadata } from "next";
import { EmbedIndiaMap } from "@/components/Embed";
import { isMapMetric } from "@/lib/map-view";

export const metadata: Metadata = { robots: { index: false } };

export default async function EmbedMapPage({ searchParams }: PageProps<"/[locale]/embed/map">) {
  const { m } = await searchParams;
  return <EmbedIndiaMap metric={isMapMetric(m) ? m : "population"} />;
}
