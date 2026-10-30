"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Footer, Header } from "@/components";
import { CardTitle, Icon } from "@/components/ui";
import { reveal } from "@/lib/motion";

const SOURCES = [
  { id: "rgi", name: "RGI / MoHFW Population Projections 2011–2036", href: "https://censusindia.gov.in" },
  {
    id: "iips",
    name: "IIPS District-level Population Projections",
    href: "https://www.iipsindia.ac.in/sites/default/files/FULL_REPORT_WITH_FINAL_TABLES.pdf",
  },
  { id: "plfs", name: "MoSPI PLFS 2023-24", href: "https://mospi.gov.in" },
  { id: "census", name: "Census of India 2011", href: "https://censusindia.gov.in" },
  { id: "gsdp", name: "MoSPI State Domestic Product", href: "https://mospi.gov.in" },
  { id: "hdi", name: "UNDP / Global Data Lab", href: "https://globaldatalab.org/shdi/" },
  { id: "wikipedia", name: "Wikipedia", href: "https://www.wikipedia.org" },
  { id: "boundaries", name: "India Maps Data", href: "https://github.com/udit-001/india-maps-data" },
  { id: "names", name: "Wikidata", href: "https://www.wikidata.org" },
] as const;

function Section({ title, children, index }: { title: string; children: ReactNode; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      {...reveal(reduceMotion, 0.08 * index)}
      className="border-t border-border-light py-10"
    >
      <CardTitle className="mb-5">{title}</CardTitle>
      {children}
    </motion.section>
  );
}

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/about" }]} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-display mb-4 text-text-primary">{t("title")}</h1>
        <p className="mb-12 max-w-2xl text-lg text-text-tertiary">{t("intro")}</p>

        <Section title={t("whyTitle")} index={1}>
          <div className="max-w-2xl space-y-4 leading-relaxed text-text-secondary">
            <p>{t("why1")}</p>
            <p>{t("why2")}</p>
          </div>
        </Section>

        <Section title={t("dataTitle")} index={2}>
          <p className="mb-6 max-w-2xl leading-relaxed text-text-secondary">{t("dataIntro")}</p>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {SOURCES.map((source) => (
              <li key={source.name}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start justify-between gap-4 border-b border-border-light py-4"
                >
                  <span>
                    <span className="block font-medium text-text-primary transition-colors group-hover:text-accent-primary">
                      {source.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-text-muted">{t(`sources.${source.id}`)}</span>
                  </span>
                  <Icon
                    name="external"
                    size={14}
                    className="mt-1 shrink-0 text-text-muted transition-colors group-hover:text-accent-primary"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
