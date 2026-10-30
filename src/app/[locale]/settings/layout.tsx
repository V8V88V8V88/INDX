import type { ReactNode } from "react";
import { routeMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/settings">) {
  return { ...(await routeMetadata(params, "/settings", "settings", "description")), robots: { index: false } };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
