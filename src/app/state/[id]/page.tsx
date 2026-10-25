import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateById } from "@/data/india";
import { StatePage } from "./StatePage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = getStateById((await params).id);
  if (!state) return {};
  return {
    title: `${state.name} - INDX`,
    description: `Districts, population, GDP, literacy and HDI of ${state.name}, mapped and ranked.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!getStateById(id)) notFound();
  return <StatePage id={id} />;
}
