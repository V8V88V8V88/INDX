"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components";
import { useSchemeIndex } from "@/hooks/useSchemes";
import { useTranslations } from "next-intl";
import { states } from "@/data/india";
import { Footer } from "@/components";
import { SCHEME_CATEGORY_ORDER, SCHEME_STATUS_ORDER, SCHEME_STATUS_STYLES } from "@/lib/schemes";
import type { SchemeCategory, SchemeScope, SchemeStatus, SchemeSummary } from "@/types/index";

type ScopeFilter = "all" | SchemeScope;
type StatusFilter = "all" | SchemeStatus;

const stateNameById = new Map(states.map((s) => [s.id, s.name]));
const SCOPES: { value: ScopeFilter; key: "all" | "central" | "state" | "ut"; bar: string }[] = [
  { value: "all", key: "all", bar: "bg-text-muted" },
  { value: "central", key: "central", bar: "bg-accent-primary" },
  { value: "state", key: "state", bar: "bg-emerald-500" },
  { value: "Union Territories", key: "ut", bar: "bg-amber-500" },
];
const barFor = (scope: SchemeScope) => SCOPES.find((s) => s.value === scope)?.bar ?? "bg-text-muted";
const selectCls =
  "w-full rounded-lg border border-border-light bg-bg-card px-3 py-2 text-sm text-text-secondary focus:border-accent-primary focus:outline-none";

export default function SchemesPage() {
  const t = useTranslations("Schemes");
  const { data: schemes, isLoading, error } = useSchemeIndex();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [stateId, setStateId] = useState("all");
  const [category, setCategory] = useState<"all" | SchemeCategory>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const all = schemes ?? [];
  const stateOptions = useMemo(() => {
    const ids = new Set(all.map((s) => s.stateId).filter((v): v is string => Boolean(v)));
    return Array.from(ids).map((id) => ({ id, name: stateNameById.get(id) ?? id })).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);
  const matches = (s: SchemeSummary, skip?: "category") => {
    const term = search.trim().toLowerCase();
    if (scope !== "all" && s.scope !== scope) return false;
    if (stateId !== "all" && s.stateId !== stateId) return false;
    if (status !== "all" && s.status !== status) return false;
    if (skip !== "category" && category !== "all" && !s.categories.includes(category)) return false;
    if (!term) return true;
    return [s.name, ...(s.aliases ?? []), s.ministry ?? "", s.government].join(" ").toLowerCase().includes(term);
  };

  const filtered = useMemo(() => all.filter((s) => matches(s)), [all, search, scope, stateId, category, status]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<SchemeCategory, number>();
    all.filter((s) => matches(s, "category")).forEach((s) => s.categories.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
    return counts;
  }, [all, search, scope, stateId, status]);

  const scopeCount = (v: ScopeFilter) => (v === "all" ? all.length : all.filter((s) => s.scope === v).length);
  const hasFilters = search || scope !== "all" || stateId !== "all" || category !== "all" || status !== "all";
  const reset = () => (setSearch(""), setScope("all"), setStateId("all"), setCategory("all"), setStatus("all"));

  const filters = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">{t("levelOfGovernment")}</p>
        <div className="space-y-1">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => (setScope(s.value), setStateId("all"))}
              aria-pressed={scope === s.value}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                scope === s.value ? "bg-accent-primary/10 font-semibold text-accent-primary" : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} />{t(`scope.${s.key}`)}</span>
              <span className="text-xs text-text-muted">{scopeCount(s.value)}</span>
            </button>
          ))}
        </div>
      </div>
      {scope !== "central" && stateOptions.length > 0 && (
        <div>
          <label htmlFor="state-filter" className="mb-2 block text-sm font-semibold text-text-primary">{t("stateOrUt")}</label>
          <select id="state-filter" value={stateId} onChange={(e) => setStateId(e.target.value)} className={selectCls}>
            <option value="all">{t("everywhere")}</option>
            {stateOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">{t("category")}</p>
        <div className="flex flex-wrap gap-1.5">
          {SCHEME_CATEGORY_ORDER.map((c) => {
            const active = category === c;
            const count = categoryCounts.get(c) ?? 0;
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? "all" : c)}
                disabled={!active && count === 0}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                  active ? "border-accent-primary bg-accent-primary text-white" : "border-border-light bg-bg-card text-text-secondary hover:border-accent-primary/50"
                }`}
              >
                {t(`categories.${c}`)} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor="status-filter" className="mb-2 block text-sm font-semibold text-text-primary">{t("status")}</label>
        <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectCls}>
          <option value="all">{t("anyStatus")}</option>
          {SCHEME_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{t(`statuses.${s}`)}</option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button onClick={reset} className="text-sm font-medium text-accent-primary hover:underline">{t("clearFilters")}</button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/schemes" }]} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-display mb-3 text-text-primary">{t("title")}</h1>
            <p className="max-w-xl text-lg text-text-tertiary">
              {t.rich("intro", {
                link: (chunks) => (
                  <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="flex gap-6 text-sm text-text-muted">
            {SCOPES.slice(1).map((s) => (
              <div key={s.value}><p className="text-2xl font-semibold text-text-primary">{scopeCount(s.value)}</p><p>{t(`scope.${s.key}`)}</p></div>
            ))}
          </div>
        </section>
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border-light bg-bg-card px-4 py-3 shadow-sm focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-text-muted" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-sm text-text-muted hover:text-text-primary" aria-label={t("clearSearch")}>{t("clear")}</button>
          )}
        </div>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <details className="rounded-xl border border-border-light bg-bg-card p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-text-primary">{t("filters")}</summary>
              <div className="mt-4">{filters}</div>
            </details>
            <div className="hidden lg:block">{filters}</div>
          </aside>
          <section aria-live="polite">
            {isLoading ? (
              <div className="space-y-3" aria-busy="true">
                <span className="sr-only">{t("loading")}</span>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
              </div>
            ) : error ? (
              <div className="card p-6">
                <p className="font-medium text-text-primary">{t("loadError")}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {error instanceof Error ? error.message : t("loadErrorHint")}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-6">
                <p className="font-medium text-text-primary">{t("noResults")}</p>
                <button onClick={reset} className="mt-2 text-sm text-accent-primary hover:underline">{t("clearFilters")}</button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-text-muted">{t("showing", { shown: filtered.length, total: all.length })}</p>
                <div className="max-h-[65vh] overflow-y-auto overscroll-contain rounded-xl border border-border-light bg-bg-secondary/30 p-3 lg:max-h-[calc(100vh-16rem)]">
                  <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">
                    {filtered.map((scheme) => <SchemeRow key={scheme.id} scheme={scheme} />)}
                  </motion.ul>
                </div>
              </>
            )}
          </section>

        </div>
          <Footer />
      </main>
    </div>
  );
}

function SchemeRow({ scheme }: { scheme: SchemeSummary }) {
  const t = useTranslations("Schemes");
  const place = scheme.scope === "central"
    ? t("centralGovernment")
    : stateNameById.get(scheme.stateId ?? "") ?? scheme.stateId ?? t("scope.state");
  return (
    <li>
      <Link href={`/schemes/${scheme.id}`} className="card card-interactive relative flex flex-col gap-3 overflow-hidden py-4 pl-6 pr-5 sm:flex-row sm:items-center sm:justify-between">
        <span className={`absolute inset-y-0 left-0 w-1.5 ${barFor(scheme.scope)}`} aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-text-primary">{scheme.name}</h3>
          <p className="mt-0.5 text-sm text-text-tertiary">
            {place}
            {scheme.ministry ? `, ${scheme.ministry}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scheme.categories.map((c) => (
              <span key={c} className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary">{t(`categories.${c}`)}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SCHEME_STATUS_STYLES[scheme.status]}`}>{t(`statuses.${scheme.status}`)}</span>
          <span className="text-xs text-text-muted">{t("since", { year: scheme.launchYear })}</span>
        </div>
      </Link>
    </li>
  );
}