import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

import { ThemeInitializer } from "@/components/ThemeInitializer";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Spotlight } from "@/components/Spotlight";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ThemeInitializer />
        <SettingsProvider>
          <QueryProvider>
            {children}
            <Spotlight />
          </QueryProvider>
        </SettingsProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
