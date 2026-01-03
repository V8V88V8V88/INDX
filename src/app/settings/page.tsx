"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components";
import { useSettings } from "@/contexts/SettingsContext";
import { THEMES } from "@/lib/theme";

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
          className="card p-5"
        >
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Appearance</h2>

          <div className="space-y-6">

            {/* Accent Color */}
            <div className="rounded-lg bg-bg-secondary p-3">
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

            {/* Units & Formats */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Distance */}
              <div className="rounded-lg bg-bg-secondary p-3">
                <h3 className="mb-3 text-sm font-medium text-text-primary">Distance Unit</h3>
                <div className="flex rounded-md bg-bg-tertiary p-1">
                  {(["km", "miles"] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => updateSetting("distanceUnit", unit)}
                      className={`flex-1 rounded py-1.5 text-sm font-medium transition-all ${settings.distanceUnit === unit
                          ? "bg-bg-primary text-text-primary shadow-sm"
                          : "text-text-muted hover:text-text-secondary"
                        }`}
                    >
                      {unit === "km" ? "Kilometers" : "Miles"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number Format */}
              <div className="rounded-lg bg-bg-secondary p-3">
                <h3 className="mb-3 text-sm font-medium text-text-primary">Number System</h3>
                <div className="flex rounded-md bg-bg-tertiary p-1">
                  {(["indian", "international"] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => updateSetting("numberFormat", format)}
                      className={`flex-1 rounded py-1.5 text-sm font-medium transition-all ${settings.numberFormat === format
                          ? "bg-bg-primary text-text-primary shadow-sm"
                          : "text-text-muted hover:text-text-secondary"
                        }`}
                    >
                      {format === "indian" ? "Lakh / Crore" : "Million / Billion"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="rounded-lg bg-bg-secondary p-3">
                <h3 className="mb-3 text-sm font-medium text-text-primary">Currency</h3>
                <div className="flex rounded-md bg-bg-tertiary p-1">
                  {(["INR", "USD"] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => updateSetting("currency", curr)}
                      className={`flex-1 rounded py-1.5 text-sm font-medium transition-all ${settings.currency === curr
                          ? "bg-bg-primary text-text-primary shadow-sm"
                          : "text-text-muted hover:text-text-secondary"
                        }`}
                    >
                      {curr === "INR" ? "Rupee (₹)" : "Dollar ($)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
