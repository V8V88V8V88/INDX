"use client";

import { motion } from "framer-motion";
import { Header } from "@/components";
import { Icon, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-6 text-8xl font-bold text-text-muted">404</div>
          <h1 className="mb-4 text-2xl font-semibold text-text-primary">
            Page Not Found
          </h1>
          <p className="mb-8 max-w-md text-text-tertiary">
            The page you&apos;re looking for doesn&apos;t exist or the state/city data 
            is not available yet.
          </p>
          <LinkButton href="/" variant="primary">
            <Icon name="arrow-left" />
            Back to India
          </LinkButton>
        </motion.div>
      </main>
    </div>
  );
}

