import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedStateMap } from "@/components/Embed";
import { getStateById } from "@/data/india";
import { isDistrictMetric } from "@/lib/districts";

export const metadata: Metadata = { robots: { index: false } };

export default async function EmbedStatePage({ params, searchParams }: PageProps<"/[locale]/embed/state/[id]">) {
  const [{ id }, { m }] = await Promise.all([params, searchParams]);
  if (!getStateById(id)) notFound();
  return <EmbedStateMap stateId={id} metric={isDistrictMetric(m) ? m : "population"} />;
}
