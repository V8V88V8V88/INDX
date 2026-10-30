"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { openSettings, SettingsDialog } from "./SettingsDialog";
import { openSpotlight, Spotlight } from "./Spotlight";
import { Button, Icon } from "./ui";

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

const menuLinks = [...navLinks, { href: "/about", key: "about" }] as const;

function MobileMenu() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState(pathname);

  if (pathname !== openedOn) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const itemClass = "block w-full rounded-xl px-4 py-3 text-left text-base font-medium transition-colors";

  return (
    <div className="relative sm:hidden">
      <Button variant="ghost" size="sm" iconOnly onClick={() => setOpen((o) => !o)} aria-label={t("menu")} aria-expanded={open}>
        <Icon name={open ? "close" : "menu"} size={18} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} aria-hidden="true" />
          <nav
            aria-label={t("main")}
            className="fixed inset-x-4 top-14 rounded-2xl border border-border-light bg-bg-card/95 p-1.5 shadow-lg backdrop-blur-md"
          >
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  itemClass,
                  pathname === link.href ? "bg-bg-secondary text-text-primary" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="my-1 border-t border-border-light" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSettings();
              }}
              className={cn(itemClass, "text-text-secondary hover:bg-bg-secondary hover:text-text-primary")}
            >
              {t("settings")}
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

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
      <a
        href="#main"
        className="sr-only rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-text-primary shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        {t("skipToContent")}
      </a>
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
          <nav aria-label={t("main")} className="mr-2 hidden items-center gap-4 sm:flex">
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
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" iconOnly onClick={openSettings} aria-label={t("settings")} title={t("settings")} aria-haspopup="dialog">
              <Icon name="settings" size={18} />
            </Button>
          </div>
          <MobileMenu />
        </div>
      </div>
      <Spotlight />
      <SettingsDialog />
    </header>
  );
}
