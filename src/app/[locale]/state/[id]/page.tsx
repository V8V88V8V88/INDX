import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStateById, states } from "@/data/india";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { StatePage } from "./StatePage";

type Props = PageProps<"/[locale]/state/[id]">;

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const state = getStateById(id);
  if (!state) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  const tStates = await getTranslations({ locale: locale as Locale, namespace: "States" });
  const name = tStates.has(state.id as Parameters<typeof tStates>[0]) ? tStates(state.id as Parameters<typeof tStates>[0]) : state.name;
  return pageMetadata({
    locale: locale as Locale,
    href: `/state/${state.id}`,
    title: t("pageTitle", { page: name }),
    description: t("stateDescription", { name }),
  });
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!getStateById(id)) notFound();
  return <StatePage id={id} />;
}
