"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Header } from "@/components";
import { BackLink, Badge, Icon } from "@/components/ui";

const SOURCES = [
  {
    name: "RGI / MoHFW Population Projections 2011–2036",
    href: "https://censusindia.gov.in",
    description: "State population and sex ratio, 2026 (Technical Group on Population Projections)",
  },
  {
    name: "IIPS District-level Population Projections",
    href: "https://www.iipsindia.ac.in/sites/default/files/FULL_REPORT_WITH_FINAL_TABLES.pdf",
    description: "District population and sex ratio, 2026, split to today's districts using 2011 census shares",
  },
  {
    name: "MoSPI PLFS 2023-24",
    href: "https://mospi.gov.in",
    description: "State literacy rate (age 7+)",
  },
  {
    name: "Census of India 2011",
    href: "https://censusindia.gov.in",
    description: "District literacy rates and areas (latest available at district level)",
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
    description: "2011 census figures on current district boundaries, compiled MoSPI GSDP tables",
  },
  {
    name: "India Maps Data",
    href: "https://github.com/udit-001/india-maps-data",
    description: "GeoJSON boundaries and district data",
  },
];

export default function AboutPage() {
  const techStack = [
    { name: "Next.js", version: "16.1.1" },
    { name: "React", version: "19.2.3" },
    { name: "TypeScript", version: "5.x" },
    { name: "Tailwind CSS", version: "4.x" },
    { name: "D3.js", version: "7.9.0" },
    { name: "Framer Motion", version: "12.23.26" },
    { name: "Recharts", version: "3.6.0" },
    { name: "TanStack Query", version: "5.90.16" },
    { name: "TopoJSON", version: "3.1.0" },
  ];

  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "About", href: "/about" }]} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
          className="mb-8"
        >
          <h1 className="text-headline mb-2 text-text-primary">About</h1>
          <p className="text-text-tertiary">
            Learn about the technology and motivation behind INDX
          </p>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="card mb-6 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, index) => (
              <motion.span
                key={tech.name}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2, delay: prefersReducedMotion ? 0 : 0.1 + index * 0.03 }}
              >
                <Badge>
                  <span className="font-medium text-text-primary">{tech.name}</span>
                  <span className="text-text-muted">v{tech.version}</span>
                </Badge>
              </motion.span>
            ))}
          </div>
        </motion.section>

        {/* Why I Build */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.2 }}
          className="card mb-6 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Why did I build this site?</h2>
          <div className="space-y-3 text-text-tertiary">
            <p>
            Since childhood, I’ve been fascinated by maps and the information around them. There was never a single place where I could properly visualize everything in one coherent way, so I decided to build it myself.</p>

<p>This project is also a tribute to Wikipedia, which genuinely helped me keep my ADHD in check during countless late-night deep dives.</p>
          </div>
        </motion.section>

        {/* Sources */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.3 }}
          className="card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Sources</h2>
          <div className="space-y-3 text-sm text-text-tertiary">
            {SOURCES.map((source) => (
              <div key={source.name}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-text-primary hover:text-accent-primary transition-colors inline-flex items-center gap-1"
                >
                  {source.name}
                  <Icon name="external" size={14} />
                </a>
                <p className="text-text-muted mt-0.5">{source.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
          className="mt-8"
        >
          <BackLink />
        </motion.div>
      </main>
    </div>
  );
}

