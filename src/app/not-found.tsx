"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components";

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
            The page you're looking for doesn't exist or the state/city data 
            is not available yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90"
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
            Back to India
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

