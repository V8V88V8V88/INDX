"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { APIStatus } from "./APIStatus";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary">
            <span className="text-sm font-bold text-white">IX</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-text-primary">
            INDX
          </span>
        </Link>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-text-tertiary transition-colors hover:text-text-primary"
            >
              India
            </Link>
            {breadcrumbs.map((item, i) => (
              <div key={item.href} className="flex items-center gap-2">
                <span className="text-text-muted">/</span>
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-text-primary">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-text-tertiary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <APIStatus />
          <ThemeToggle />
          <Link href="/settings">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg border border-border-light p-2 text-text-secondary transition-colors hover:bg-bg-secondary"
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m9-9h-6M9 12H3m15.364-6.364l-4.243 4.243M8.879 15.121l-4.243 4.243m11.314 0l-4.243-4.243M8.879 8.879L4.636 4.636" />
              </svg>
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            Compare
          </motion.button>
        </div>
      </div>
    </header>
  );
}
