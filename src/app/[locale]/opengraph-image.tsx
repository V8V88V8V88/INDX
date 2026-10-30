import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { DISTRICT_COUNT, formatPopulation, india } from "@/data/india";
import { routing } from "@/i18n/routing";
import { OG_SIZE, OgCard, ogFonts, shapePath } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "INDX - India, mapped and indexed";
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image() {
  const t = await getTranslations({ locale: "en", namespace: "Metadata" });
  const tHome = await getTranslations({ locale: "en", namespace: "Home" });
  const tState = await getTranslations({ locale: "en", namespace: "State" });

  const title = t("tagline");
  const subtitle = "ind-x.vercel.app";
  const stats = [
    { label: tHome("totalPopulation"), value: formatPopulation(india.population) },
    { label: tHome("statesAndUts"), value: tHome("statesAndUtsValue", { states: 28, uts: 8 }) },
    { label: tState("districts"), value: String(DISTRICT_COUNT) },
  ];

  return new ImageResponse(
    <OgCard title={title} subtitle={subtitle} stats={stats} paths={await shapePath("india-states.json", 500)} />,
    { ...size, fonts: await ogFonts() },
  );
}
