"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components";
import { getSettings, updateSetting, type Settings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== "undefined") {
      return getSettings();
    }
    return { disableLocalData: false };
  });

  const handleToggle = (key: keyof Settings, value: boolean) => {
    const updated = updateSetting(key, value);
    setSettings(updated);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "Settings", href: "/settings" }]} />
      
      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-display mb-3 text-text-primary">Settings</h1>
          <p className="text-lg text-text-tertiary">
            Configure data sources and API behavior for testing
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="mb-4 text-xl font-semibold text-text-primary">Data Sources</h2>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-border-light pb-6">
              <div className="flex-1">
                <h3 className="mb-1 font-medium text-text-primary">Disable Local JSON Data</h3>
                <p className="text-sm text-text-tertiary">
                  When enabled, the app will only use API data and won&apos;t fallback to local JSON files.
                  Use this to test your API integration without local data interference.
                </p>
              </div>
              <button
                onClick={() => handleToggle("disableLocalData", !settings.disableLocalData)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                  settings.disableLocalData ? "bg-accent-primary" : "bg-bg-tertiary"
                }`}
                role="switch"
                aria-checked={settings.disableLocalData}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.disableLocalData ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-lg bg-bg-secondary p-4">
              <h4 className="mb-2 text-sm font-medium text-text-primary">Current Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Local JSON fallback:</span>
                  <span className={`font-medium ${settings.disableLocalData ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    {settings.disableLocalData ? "Disabled" : "Enabled"}
                  </span>
                </div>
                {settings.disableLocalData && (
                  <p className="mt-3 text-xs text-text-muted">
                    ⚠️ API-only mode: If API requests fail, no data will be shown.
                  </p>
                )}
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

