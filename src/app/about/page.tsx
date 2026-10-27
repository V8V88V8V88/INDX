"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Footer, Header } from "@/components";
import { CardTitle, Icon } from "@/components/ui";
import { reveal } from "@/lib/motion";

const SOURCES = [
  {
    name: "RGI / MoHFW Population Projections 2011–2036",
    href: "https://censusindia.gov.in",
    description: "State population and sex ratio for 2026",
  },
  {
    name: "IIPS District-level Population Projections",
    href: "https://www.iipsindia.ac.in/sites/default/files/FULL_REPORT_WITH_FINAL_TABLES.pdf",
    description: "District population and sex ratio for 2026, mapped to today's districts using 2011 census shares",
  },
  {
    name: "MoSPI PLFS 2023-24",
    href: "https://mospi.gov.in",
    description: "State literacy rates (age 7+)",
  },
  {
    name: "Census of India 2011",
    href: "https://censusindia.gov.in",
    description: "District literacy rates and areas, the latest available at district level",
  },
  {
    name: "MoSPI State Domestic Product",
    href: "https://mospi.gov.in",
    description: "GSDP at current prices, FY 2024-25 where available",
  },
  {
    name: "UNDP / Global Data Lab",
    href: "https://globaldatalab.org/shdi/",
    description: "Subnational Human Development Index, 2023",
  },
  {
    name: "Wikipedia",
    href: "https://www.wikipedia.org",
    description: "2011 census figures on current district boundaries and compiled GSDP tables",
  },
  {
    name: "India Maps Data",
    href: "https://github.com/udit-001/india-maps-data",
    description: "State and district boundaries",
  },
];

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
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "About", href: "/about" }]} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-display mb-4 text-text-primary">About</h1>
        <p className="mb-12 max-w-2xl text-lg text-text-tertiary">
          INDX puts every state, union territory and district of India on one map, with the numbers behind each of them.
        </p>

        <Section title="Why I built it" index={1}>
          <div className="max-w-2xl space-y-4 leading-relaxed text-text-secondary">
            <p>
              I&apos;ve loved maps since I was a kid, and all the little facts that come with them. I could never find
              one place that showed it all together, so I built it.
            </p>
            <p>
              It&apos;s also a thank-you to Wikipedia, which got me through countless late-night deep dives and genuinely
              helped me keep my ADHD in check.
            </p>
          </div>
        </Section>

        <Section title="The data" index={2}>
          <p className="mb-6 max-w-2xl leading-relaxed text-text-secondary">
            India hasn&apos;t had a census since 2011, so population figures are official 2026 projections. Where newer
            numbers don&apos;t exist, the latest available source is used.
          </p>
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
                    <span className="mt-0.5 block text-sm text-text-muted">{source.description}</span>
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
