"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";
import { openSpotlight } from "./Spotlight";
import { Button, Icon, LinkButton } from "./ui";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const pathname = usePathname();
  const onCompare = pathname === "/compare";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tighter text-text-primary">INDX</span>
          <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
        </Link>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm sm:flex">
            <Link href="/" className="text-text-tertiary transition-colors hover:text-text-primary">
              India
            </Link>
            {breadcrumbs.map((item, i) => (
              <div key={item.href} className="flex items-center gap-2">
                <span className="text-text-muted">/</span>
                {i === breadcrumbs.length - 1 ? (
                  <span aria-current="page" className="font-medium text-text-primary">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="text-text-tertiary transition-colors hover:text-text-primary">
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1">
          <Link
            href="/compare"
            aria-current={onCompare ? "page" : undefined}
            className={cn(
              "mr-2 text-sm font-medium transition-colors hover:text-text-primary",
              onCompare ? "text-text-primary" : "text-text-secondary",
            )}
          >
            Compare
          </Link>
          <Button variant="ghost" size="sm" iconOnly onClick={openSpotlight} aria-label="Search" title="Search (Ctrl+K)">
            <Icon name="search" size={18} />
          </Button>
          <ThemeToggle />
          <LinkButton href="/settings" variant="ghost" size="sm" iconOnly aria-label="Settings" title="Settings">
            <Icon name="settings" size={18} />
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
