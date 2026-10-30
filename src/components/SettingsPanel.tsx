"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations, type Messages } from "next-intl";
import { useSettings } from "@/contexts/SettingsContext";
import { LOCALES } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { FY_AVERAGE_INR_PER_USD } from "@/lib/fx";
import { newIssueUrl } from "@/lib/site";
import { THEMES } from "@/lib/theme";
import { useChangeLocale } from "./LanguageSwitcher";
import { setThemePreference, useThemePreference } from "./ThemeToggle";
import { Button, Icon, SegmentedControl } from "./ui";

function Panel({ title, hint, className, children }: { title: string; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl bg-bg-secondary p-4", className)}>
      <h3 className="mb-3 text-sm font-medium text-text-primary">{title}</h3>
      {children}
      {hint && <p className="mt-2.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export function SettingsSection({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function LanguageSettings() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  const reportUrl = newIssueUrl("translation.yml", { language: LOCALES.find((l) => l.code === locale)?.name ?? locale });

  return (
    <Panel
      title={t("language")}
      hint={
        <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-text-primary">
          {t("translationError")}
          <Icon name="external" size={12} />
        </a>
      }
    >
      <div role="radiogroup" aria-label={t("language")} className="flex flex-wrap gap-2">
        {LOCALES.map((option) => {
          const selected = option.code === locale;
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={selected}
              lang={option.code}
              onClick={() => !selected && changeLocale(option.code)}
              className={cn(
                "h-8 rounded-full px-3.5 text-sm transition-colors",
                selected
                  ? "bg-accent-primary text-white"
                  : "border border-border-light text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
              )}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function AppearanceSettings() {
  const t = useTranslations("Settings");
  const { settings, updateSetting } = useSettings();
  const themePreference = useThemePreference();
  const activeAccent = THEMES.find((theme) => theme.id === settings.accentColor);
  const accentLabel = (id: string) => t(`accents.${id as keyof Messages["Settings"]["accents"]}`);

  return (
    <div className="space-y-4">
      <Panel title={t("accentColor")} hint={activeAccent && accentLabel(activeAccent.id)}>
        <div role="radiogroup" aria-label={t("accentColor")} className="flex flex-wrap items-center gap-3">
          {THEMES.map((theme) => {
            const isSelected = settings.accentColor === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={accentLabel(theme.id)}
                title={accentLabel(theme.id)}
                onClick={() => updateSetting("accentColor", theme.id)}
                className={cn(
                  "h-9 w-9 rounded-full ring-offset-2 ring-offset-bg-secondary transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-muted",
                  isSelected && "ring-2 ring-text-primary focus-visible:ring-text-primary",
                )}
                style={{ backgroundColor: theme.colors.secondary }}
              />
            );
          })}
        </div>
      </Panel>

      <Panel title={t("theme")} hint={themePreference === "system" ? t("themeSystemHint") : undefined}>
        <SegmentedControl
          label={t("theme")}
          size="sm"
          fullWidth
          value={themePreference}
          onChange={setThemePreference}
          options={[
            { value: "system", label: t("themeSystem") },
            { value: "light", label: t("themeLight") },
            { value: "dark", label: t("themeDark") },
          ]}
        />
      </Panel>
    </div>
  );
}

export function FormatSettings({ className }: { className?: string }) {
  const t = useTranslations("Settings");
  const { settings, updateSetting } = useSettings();

  return (
    <div className={cn("grid gap-4", className)}>
      <Panel title={t("units")} hint={settings.distanceUnit === "km" ? t("unitsMetricHint") : t("unitsImperialHint")}>
        <SegmentedControl
          label={t("units")}
          size="sm"
          fullWidth
          value={settings.distanceUnit}
          onChange={(unit) => updateSetting("distanceUnit", unit)}
          options={[
            { value: "km", label: t("metric") },
            { value: "miles", label: t("imperial") },
          ]}
        />
      </Panel>

      <Panel title={t("numberSystem")} hint={settings.numberFormat === "indian" ? t("numberIndianHint") : t("numberInternationalHint")}>
        <SegmentedControl
          label={t("numberSystem")}
          size="sm"
          fullWidth
          value={settings.numberFormat}
          onChange={(format) => updateSetting("numberFormat", format)}
          options={[
            { value: "indian", label: t("indian") },
            { value: "international", label: t("international") },
          ]}
        />
      </Panel>

      <Panel
        title={t("currency")}
        hint={settings.currency === "INR" ? t("currencyInrHint") : t("currencyUsdHint", { rate: FY_AVERAGE_INR_PER_USD["2024-25"], year: "2024-25" })}
      >
        <SegmentedControl
          label={t("currency")}
          size="sm"
          fullWidth
          value={settings.currency}
          onChange={(curr) => updateSetting("currency", curr)}
          options={[
            { value: "INR", label: "₹ INR" },
            { value: "USD", label: "$ USD" },
          ]}
        />
      </Panel>
    </div>
  );
}

export function ResetSettingsButton() {
  const t = useTranslations("Settings");
  const { resetSettings } = useSettings();

  return (
    <Button
      size="sm"
      onClick={() => {
        resetSettings();
        setThemePreference("system");
      }}
    >
      <Icon name="reset" size={14} />
      {t("reset")}
    </Button>
  );
}

export function SettingsContent() {
  const t = useTranslations("Settings");

  return (
    <div className="space-y-8">
      <SettingsSection title={t("appearance")}>
        <div className="space-y-4">
          <LanguageSettings />
          <AppearanceSettings />
        </div>
      </SettingsSection>
      <SettingsSection title={t("unitsAndFormats")}>
        <FormatSettings className="sm:grid-cols-3" />
      </SettingsSection>
      <ResetSettingsButton />
    </div>
  );
}
