import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { THEMES } from "@/lib/theme";
import { SETTINGS_KEY, defaultSettings } from "@/lib/settings";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "INDX India Data Explorer",
  description: "Geographic and statistical data visualization for India. Explore country, state, and city-level insights.",
  keywords: ["India", "data visualization", "statistics", "geography", "states", "cities", "districts"],
};

import { SettingsProvider } from "@/contexts/SettingsContext";
import { Spotlight } from "@/components/Spotlight";

// Applies the stored dark mode and accent color before first paint, so the page
// doesn't flash the default theme until React hydrates.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="antialiased">
        <SettingsProvider>
          <QueryProvider>
            {children}
            <Spotlight />
          </QueryProvider>
        </SettingsProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
