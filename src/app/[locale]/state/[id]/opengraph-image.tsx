import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { formatPopulation, getStateById, states } from "@/data/india";
import { routing } from "@/i18n/routing";
import { OG_SIZE, OgCard, ogFonts, ogText, shapePath } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "INDX state map";
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => states.map((state) => ({ locale, id: state.id })));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const state = getStateById((await params).id)!;
  const tRegions = await getTranslations({ locale: "en", namespace: "Regions" });
  const tMetrics = await getTranslations({ locale: "en", namespace: "Metrics" });

  const title = state.name;
  const subtitle = `${tRegions("ofIndia", { region: state.region })} · ${state.capital}`;
  const stats = [
    { label: tMetrics("population.short"), value: formatPopulation(state.population) },
    { label: tMetrics("literacyRate.short"), value: `${state.literacyRate.toFixed(1)}%` },
    { label: tMetrics("hdi.short"), value: state.hdi.toFixed(3) },
  ];

  return new ImageResponse(
    <OgCard title={title} subtitle={subtitle} stats={stats} paths={await shapePath(`geo/states/${state.id}.json`, 500)} />,
    { ...size, fonts: await ogFonts(ogText(title, subtitle, ...stats.flatMap((s) => [s.label, s.value]))) },
  );
}
