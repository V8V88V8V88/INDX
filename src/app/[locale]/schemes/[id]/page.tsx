"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components";
import { useScheme } from "@/hooks/useSchemes";
import { states } from "@/data/india";
import { SCHEME_STATUS_STYLES } from "@/lib/schemes";

interface PageProps {
  params: Promise<{ id: string }>;
}

const stateNameById = new Map(states.map((s) => [s.id, s.name]));
const BAR: Record<string, string> = { central: "bg-accent-primary", state: "bg-emerald-500", "Union Territories": "bg-amber-500" };
const label = "text-xs font-semibold uppercase tracking-wide text-text-muted";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function SchemeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("Schemes");
  const td = useTranslations("SchemeDetail");
  const { data: scheme, isLoading, error } = useScheme(id);

  if (isLoading) {
    return (
      <Shell>
        <div className="animate-pulse space-y-6">
          <div className="card h-40" />
          <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
            <div className="card h-64" />
            <div className="space-y-6">
              <div className="card h-32" />
              <div className="card h-56" />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="card p-6">
          <p className="font-medium text-text-primary">{td("loadError")}</p>
          <p className="mt-1 text-sm text-text-muted">{error instanceof Error ? error.message : td("loadErrorHint")}</p>
        </div>
      </Shell>
    );
  }

  if (!scheme) {
    notFound();
  }

  const place = scheme.scope === "central"
    ? t("centralGovernment")
    : td("governmentOf", { state: stateNameById.get(scheme.stateId ?? "") ?? scheme.stateId ?? t("scope.state") });
  const applyUrl = scheme.application.find((a) => a.url)?.url;
  const glance = [
    { label: td("level"), value: place },
    { label: td("implementedBy"), value: scheme.ministry || scheme.government },
    { label: td("launched"), value: scheme.launchDate || String(scheme.launchYear) },
  ];
  const stats = [
    { value: scheme.launchYear, label: td("sinceLabel") },
    { value: scheme.benefits.length, label: td("benefits") },
    { value: scheme.eligibility.length, label: td("criteria") },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/schemes" }, { label: scheme.name, href: `/schemes/${scheme.id}` }]} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/schemes" className="mb-4 inline-block text-sm text-text-muted hover:text-accent-primary">{td("allSchemes")}</Link>

        <section className="card relative mb-8 overflow-hidden py-6 pl-8 pr-6">
          <span className={`absolute inset-y-0 left-0 w-1.5 ${BAR[scheme.scope] ?? "bg-text-muted"}`} aria-hidden="true" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SCHEME_STATUS_STYLES[scheme.status]}`}>{t(`statuses.${scheme.status}`)}</span>

              </div>
              <h1 className="text-display mb-2 text-text-primary">{scheme.name}</h1>
              <p className="text-lg text-text-tertiary">
                {place}
                {scheme.ministry ? `, ${scheme.ministry}` : ""}
              </p>
              {scheme.aliases && scheme.aliases.length > 0 && (
                <p className="mt-1 text-sm text-text-muted">{td("alsoKnownAs", { aliases: scheme.aliases.join(", ") })}</p>
              )}
            </div>
            <div className="flex gap-6 text-sm text-text-muted">
              {stats.map((s) => (
                <div key={s.label}><p className="text-2xl font-semibold text-text-primary">{s.value}</p><p>{s.label}</p></div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-6 lg:order-first lg:self-start">
            <div className="card p-5">
              <p className="mb-4 text-sm font-semibold text-text-primary">{td("atAGlance")}</p>
              <dl className="space-y-4">
                {glance.map((g) => (
                  <div key={g.label}><dt className={label}>{g.label}</dt><dd className="mt-0.5 text-sm text-text-secondary">{g.value}</dd></div>
                ))}
              </dl>
              {applyUrl && (
                <a href={applyUrl} {...ext} className="mt-5 block rounded-lg bg-accent-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90">
                  {td("apply")}
                </a>
              )}
            </div>

            <div className="card p-5">
              <p className="mb-3 text-sm font-semibold text-text-primary">{td("officialLinks")}</p>
              <div className="space-y-2">
                {scheme.officialUrls.length > 0 ? (
                  scheme.officialUrls.slice(0, 2).map((link) => (
                    <a key={link} href={link} {...ext} className="block break-all text-sm text-accent-primary hover:underline">{link}</a>
                  ))
                ) : (
                  <p className="text-sm text-text-muted">{td("noOfficialLinks")}</p>
                )}
              </div>
              {scheme.sources.length > 0 && (
                <div className="mt-4 border-t border-border-light pt-4">
                  <p className={`mb-2 ${label}`}>{td("sources")}</p>
                  {scheme.sources.slice(0, 2).map((source) => (
                    <a key={source.url} href={source.url} {...ext} className="block py-0.5 text-xs text-text-tertiary hover:text-accent-primary">
                      {source.title} · {td("checked", { date: source.accessed })}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-6">
            <Panel title={td("about")}>
              <p className="text-base leading-relaxed text-text-secondary">{scheme.objectives}</p>
            </Panel>

            <Panel title={td("benefits")} count={scheme.benefits.length}>
              {scheme.benefits.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {scheme.benefits.map((benefit, index) => (
                    <li key={`${benefit.summary}-${index}`} className="rounded-lg border border-border-light bg-bg-secondary/50 p-4">
                      <span className="mb-2 block h-1 w-8 rounded-full bg-accent-primary" aria-hidden="true" />
                      <p className="font-medium text-text-primary">{benefit.summary}</p>
                      {benefit.details && <p className="mt-1 text-sm text-text-secondary">{benefit.details}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">{td("noBenefits")}</p>
              )}
            </Panel>

            <Panel title={td("eligibility")} count={scheme.eligibility.length}>
              {scheme.eligibility.length > 0 ? (
                <ul className="divide-y divide-border-light">
                  {scheme.eligibility.map((entry, index) => (
                    <li key={`${entry.appliesTo}-${index}`} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                      <p className={label}>{entry.appliesTo}</p>
                      <p className="text-sm text-text-secondary">{entry.criteria}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">{td("noEligibility")}</p>
              )}
            </Panel>

            <Panel title={td("howToApply")}>
              {scheme.application.length > 0 ? (
                <ol className="space-y-4">
                  {scheme.application.map((step, index) => (
                    <li key={`${step.channel}-${index}`} className="flex gap-4">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">{index + 1}</span>
                      <div className="min-w-0">
                        <p className={label}>{step.channel}</p>
                        <p className="mt-1 text-sm text-text-secondary">{step.steps}</p>
                        {step.url && (
                          <a href={step.url} {...ext} className="mt-2 inline-block text-sm font-medium text-accent-primary hover:underline">{td("goToPortal")}</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-text-muted">{td("noApplication")}</p>
              )}
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Schemes");
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/schemes" }]} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}