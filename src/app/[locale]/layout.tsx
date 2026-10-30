import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { QueryProvider } from "@/lib/query-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { THEMES } from "@/lib/theme";
import { SETTINGS_KEY, defaultSettings } from "@/lib/settings";
import { routing } from "@/i18n/routing";
import { scriptFonts } from "@/i18n/fonts";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { cn } from "@/lib/cn";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: "Metadata" });
  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    keywords: ["India", "data visualization", "statistics", "geography", "states", "cities", "districts"],
  };
}

const themeBootScript = `(function(){try{
var d=document.documentElement,t=localStorage.getItem("theme");
if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");
var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}");
var themes=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, t.colors])))};
var c=themes[s.accentColor||${JSON.stringify(defaultSettings.accentColor)}]||themes[${JSON.stringify(THEMES[0].id)}];
d.style.setProperty("--accent-primary",c.primary);
d.style.setProperty("--accent-secondary",c.secondary);
d.style.setProperty("--accent-muted",c.muted);
d.style.setProperty("--accent-dark",c.dark);
}catch(e){}})();`;

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      className={cn(inter.variable, jetbrainsMono.variable, scriptFonts[locale]?.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider>
          <SettingsProvider>
            <QueryProvider>{children}</QueryProvider>
          </SettingsProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
