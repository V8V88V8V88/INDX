import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStateById, states } from "@/data/india";
import { StatePage } from "./StatePage";

type Props = PageProps<"/[locale]/state/[id]">;

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const state = getStateById((await params).id);
  if (!state) return {};
  const t = await getTranslations("Metadata");
  const tStates = await getTranslations("States");
  const name = tStates.has(state.id as Parameters<typeof tStates>[0]) ? tStates(state.id as Parameters<typeof tStates>[0]) : state.name;
  return {
    title: t("pageTitle", { page: name }),
    description: t("stateDescription", { name }),
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!getStateById(id)) notFound();
  return <StatePage id={id} />;
}
