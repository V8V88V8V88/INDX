import type { MetadataRoute } from "next";
import { states } from "@/data/india";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { allDistricts } from "@/lib/district-data";
import { districtPath } from "@/lib/districts";
import { SITE_URL } from "@/lib/site";

function url(href: string, locale: (typeof routing.locales)[number]) {
  return SITE_URL + getPathname({ href, locale });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const districts = [...allDistricts().entries()].flatMap(([stateId, list]) => list.map((d) => districtPath(stateId, d.name)));
  const pages = ["/", "/map", "/compare", "/about", ...states.map((state) => `/state/${state.id}`), ...districts];

  return pages.flatMap((href) =>
    routing.locales.map((locale) => ({
      url: url(href, locale),
      alternates: {
        languages: Object.fromEntries([
          ...routing.locales.map((l) => [l, url(href, l)]),
          ["x-default", url(href, routing.defaultLocale)],
        ]),
      },
    })),
  );
}
