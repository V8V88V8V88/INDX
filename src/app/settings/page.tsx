"use client";

import { motion } from "framer-motion";
import { Header } from "@/components";
import { BackLink, SegmentedControl } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { THEMES } from "@/lib/theme";

const panelClass = "rounded-xl bg-bg-secondary p-4";

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  const handleColorChange = (colorId: string) => {
    updateSetting("accentColor", colorId);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "Settings", href: "/settings" }]} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-headline mb-2 text-text-primary">Settings</h1>
          <p className="text-text-tertiary">
            Configure visual preferences and application behavior
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Appearance</h2>

          <div className="space-y-4">
            <div className={panelClass}>
              <h3 className="mb-3 text-sm font-medium text-text-primary">Accent Color</h3>
              <div className="flex flex-wrap items-center gap-3">
                {THEMES.map((theme) => {
                  const isSelected = settings.accentColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleColorChange(theme.id)}
                      title={theme.label}
                      className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected ? "ring-2 ring-text-primary ring-offset-2" : ""
                        }`}
                      style={{ backgroundColor: theme.colors.secondary }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="check"
                          className="h-3.5 w-3.5 rounded-full border-[1.5px] border-white bg-transparent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={panelClass}>
                <h3 className="mb-3 text-sm font-medium text-text-primary">Distance Unit</h3>
                <SegmentedControl
                  label="Distance unit"
                  size="sm"
                  fullWidth
                  value={settings.distanceUnit}
                  onChange={(unit) => updateSetting("distanceUnit", unit)}
                  options={[
                    { value: "km", label: "Kilometers" },
                    { value: "miles", label: "Miles" },
                  ]}
                />
              </div>

              <div className={panelClass}>
                <h3 className="mb-3 text-sm font-medium text-text-primary">Number System</h3>
                <SegmentedControl
                  label="Number system"
                  size="sm"
                  fullWidth
                  value={settings.numberFormat}
                  onChange={(format) => updateSetting("numberFormat", format)}
                  options={[
                    { value: "indian", label: "Lakh / Crore" },
                    { value: "international", label: "Million / Billion" },
                  ]}
                />
              </div>

              <div className={panelClass}>
                <h3 className="mb-3 text-sm font-medium text-text-primary">Currency</h3>
                <SegmentedControl
                  label="Currency"
                  size="sm"
                  fullWidth
                  value={settings.currency}
                  onChange={(curr) => updateSetting("currency", curr)}
                  options={[
                    { value: "INR", label: "Rupee (₹)" },
                    { value: "USD", label: "Dollar ($)" },
                  ]}
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <BackLink />
        </motion.div>
      </main>
    </div>
  );
}
