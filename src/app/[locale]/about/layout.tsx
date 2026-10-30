import type { ReactNode } from "react";
import { routeMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/about">) {
  return { ...(await routeMetadata(params, "/about", "about", "aboutDescription")) };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
