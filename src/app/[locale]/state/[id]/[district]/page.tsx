import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStateById } from "@/data/india";
import { pageMetadata } from "@/i18n/metadata";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { districtProfile, findDistrict, localPlaceName } from "@/lib/district-data";
import { districtPath, districtSlug } from "@/lib/districts";
import { DistrictPage } from "./DistrictPage";

type Props = PageProps<"/[locale]/state/[id]/[district]">;
type StateKey = Parameters<Awaited<ReturnType<typeof getTranslations<"States">>>>[0];

export function generateStaticParams() {
  return [];
}

async function resolve(params: Props["params"]) {
  const { locale, id, district: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const state = getStateById(id);
  const district = state ? findDistrict(state.id, slug) : null;
  return { locale: locale as Locale, state, district, slug };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state, district } = await resolve(params);
  if (!state || !district) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const tDistrict = await getTranslations({ locale, namespace: "District" });
  const tStates = await getTranslations({ locale, namespace: "States" });
  const name = localPlaceName(locale, state.id, district.name);
  const stateName = tStates(state.id as StateKey);
  return pageMetadata({
    locale,
    href: districtPath(state.id, district.name),
    title: t("pageTitle", { page: tDistrict("title", { name, state: stateName }) }),
    description: tDistrict("description", { name, state: stateName }),
    image: getPathname({ href: `/state/${state.id}/opengraph-image`, locale }),
  });
}

export default async function Page({ params }: Props) {
  const { locale, state, district, slug } = await resolve(params);
  if (!state || !district) notFound();
  if (slug !== districtSlug(district.name)) redirect({ href: districtPath(state.id, district.name), locale });
  const profile = districtProfile(state.id, district);
  const englishNames = [district.name, district.headquarters, ...profile.neighbours].filter((n): n is string => !!n);
  const names = Object.fromEntries(englishNames.map((n) => [n, localPlaceName(locale, state.id, n)]));
  return <DistrictPage stateId={state.id} profile={profile} names={names} />;
}
