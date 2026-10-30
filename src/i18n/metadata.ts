import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "./navigation";
import { routing, type Locale } from "./routing";

interface PageMetadataOptions {
  locale: Locale;
  href: string;
  title: string;
  description: string;
}

export function pageMetadata({ locale, href, title, description }: PageMetadataOptions): Metadata {
  const url = getPathname({ href, locale });
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, getPathname({ href, locale: l })]),
        ["x-default", getPathname({ href, locale: routing.defaultLocale })],
      ]),
    },
    openGraph: { title, description, url, siteName: "INDX", locale, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

type NavPage = "map" | "compare" | "about" | "settings";
type DescriptionKey = "description" | "mapDescription" | "compareDescription" | "aboutDescription";

export async function routeMetadata(params: Promise<{ locale: string }>, href: string, page: NavPage | null, descriptionKey: DescriptionKey) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  return pageMetadata({
    locale,
    href,
    title: page ? t("pageTitle", { page: tNav(page) }) : t("title"),
    description: t(descriptionKey),
  });
}
