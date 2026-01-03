"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

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
          <ThemeToggle />
          <Link href="/settings">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg border border-border-light p-2 text-text-secondary transition-colors hover:bg-bg-secondary"
              aria-label="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
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
