"use client";

import { useReducedMotion, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Footer, Header } from "@/components";
import { AppearanceSettings, FormatSettings, LanguageSettings, ResetSettingsButton, SettingsSection } from "@/components/SettingsPanel";
import { reveal } from "@/lib/motion";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/settings" }]} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-8">
          <h1 className="text-headline mb-2 text-text-primary">{t("title")}</h1>
          <p className="text-text-tertiary">{t("intro")}</p>
        </motion.section>

        <motion.div {...reveal(reduceMotion, 0.08)} className="card p-6">
          <SettingsSection title={t("appearance")}>
            <div className="space-y-4">
              <LanguageSettings />
              <AppearanceSettings />
            </div>
          </SettingsSection>
        </motion.div>

        <motion.div {...reveal(reduceMotion, 0.16)} className="card mt-6 p-6">
          <SettingsSection title={t("unitsAndFormats")}>
            <FormatSettings className="md:grid-cols-3" />
          </SettingsSection>
        </motion.div>

        <motion.div {...reveal(reduceMotion, 0.24)} className="mt-6">
          <ResetSettingsButton />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
