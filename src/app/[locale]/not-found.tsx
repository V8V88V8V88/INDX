"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Header } from "@/components";
import { Icon, LinkButton } from "@/components/ui";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main id="main" className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mb-6 text-8xl font-bold text-text-muted">404</div>
          <h1 className="mb-4 text-2xl font-semibold text-text-primary">
            {t("title")}
          </h1>
          <p className="mb-8 max-w-md text-text-tertiary">
            {t("description")}
          </p>
          <LinkButton href="/" variant="primary">
            <Icon name="arrow-left" />
            {t("back")}
          </LinkButton>
        </motion.div>
      </main>
    </div>
  );
}
