"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { openSpotlight, Spotlight } from "./Spotlight";
import { Button, Icon, LinkButton } from "./ui";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  overlay?: boolean;
}

const navLinks = [
  { href: "/map", key: "map" },
  { href: "/compare", key: "compare" },
] as const;

export function Header({ breadcrumbs, overlay }: HeaderProps) {
  const t = useTranslations("Nav");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={cn("top-0 z-50 w-full", overlay ? "fixed" : "sticky")}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-bg-primary/90 via-bg-primary/60 to-transparent backdrop-blur-md transition-opacity duration-300 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]",
          scrolled || overlay ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tighter text-text-primary">INDX</span>
          <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
        </Link>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label={t("breadcrumb")} className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-sm sm:flex">
            <Link href="/" className="text-text-tertiary transition-colors hover:text-text-primary">
              {tCommon("india")}
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
          <nav aria-label={t("main")} className="mr-2 flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-text-primary",
                  pathname === link.href ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" iconOnly onClick={openSpotlight} aria-label={t("search")} title={t("searchShortcut")}>
            <Icon name="search" size={18} />
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
          <LinkButton href="/settings" variant="ghost" size="sm" iconOnly aria-label={t("settings")} title={t("settings")}>
            <Icon name="settings" size={18} />
          </LinkButton>
        </div>
      </div>
      <Spotlight />
    </header>
  );
}
