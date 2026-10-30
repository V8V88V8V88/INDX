"use client";

import { useReducedMotion, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Footer, Header } from "@/components";
import { SettingsContent } from "@/components/SettingsPanel";
import { reveal } from "@/lib/motion";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: t("breadcrumb"), href: "/settings" }]} />

      <main id="main" className="mx-auto max-w-4xl px-6 py-8">
        <motion.section {...reveal(reduceMotion)} className="mb-8">
          <h1 className="text-headline mb-2 text-text-primary">{t("title")}</h1>
          <p className="text-text-tertiary">{t("intro")}</p>
        </motion.section>

        <motion.div {...reveal(reduceMotion, 0.08)} className="card p-6">
          <SettingsContent />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
