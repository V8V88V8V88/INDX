"use client";

import { useReducedMotion, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Footer, Header, setThemePreference, useThemePreference } from "@/components";
import { Button, Icon, SegmentedControl } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/cn";
import { FY_AVERAGE_INR_PER_USD } from "@/lib/fx";
import { reveal } from "@/lib/motion";
import { THEMES } from "@/lib/theme";

function Panel({ title, hint, className, children }: { title: string; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl bg-bg-secondary p-4", className)}>
      <h3 className="mb-3 text-sm font-medium text-text-primary">{title}</h3>
      {children}
      {hint && <p className="mt-2.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const themePreference = useThemePreference();
  const reduceMotion = useReducedMotion();
  const activeAccent = THEMES.find((theme) => theme.id === settings.accentColor);

  const handleReset = () => {
    resetSettings();
    setThemePreference("system");
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "Settings", href: "/settings" }]} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-8">
          <h1 className="text-headline mb-2 text-text-primary">Settings</h1>
          <p className="text-text-tertiary">Accent, theme and how numbers are shown across INDX</p>
        </motion.section>

        <motion.section {...reveal(reduceMotion, 0.08)} className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Appearance</h2>

          <div className="space-y-4">
            <Panel title="Accent color" hint={activeAccent?.label}>
              <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap items-center gap-3">
                {THEMES.map((theme) => {
                  const isSelected = settings.accentColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={theme.label}
                      title={theme.label}
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

            <Panel title="Theme" hint={themePreference === "system" ? "Follows your device setting" : undefined}>
              <SegmentedControl
                label="Theme"
                size="sm"
                fullWidth
                value={themePreference}
                onChange={setThemePreference}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Panel>
          </div>
        </motion.section>

        <motion.section {...reveal(reduceMotion, 0.16)} className="card mt-6 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Units &amp; formats</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Units" hint={settings.distanceUnit === "km" ? "Area in km², density per km²" : "Area in mi², density per mi²"}>
              <SegmentedControl
                label="Units"
                size="sm"
                fullWidth
                value={settings.distanceUnit}
                onChange={(unit) => updateSetting("distanceUnit", unit)}
                options={[
                  { value: "km", label: "Metric" },
                  { value: "miles", label: "Imperial" },
                ]}
              />
            </Panel>

            <Panel title="Number system" hint={settings.numberFormat === "indian" ? "Lakh and crore, e.g. 12.5 Cr" : "Million and billion, e.g. 125 M"}>
              <SegmentedControl
                label="Number system"
                size="sm"
                fullWidth
                value={settings.numberFormat}
                onChange={(format) => updateSetting("numberFormat", format)}
                options={[
                  { value: "indian", label: "Indian" },
                  { value: "international", label: "International" },
                ]}
              />
            </Panel>

            <Panel title="Currency" hint={settings.currency === "INR" ? "Values as published" : `At each figure's fiscal-year average, e.g. ₹${FY_AVERAGE_INR_PER_USD["2024-25"]} = $1 for FY 2024-25`}>
              <SegmentedControl
                label="Currency"
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
        </motion.section>

        <motion.div {...reveal(reduceMotion, 0.24)} className="mt-6">
          <Button size="sm" onClick={handleReset}>
            <Icon name="reset" size={14} />
            Reset to defaults
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
