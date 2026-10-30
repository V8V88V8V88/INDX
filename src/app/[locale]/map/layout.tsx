import type { ReactNode } from "react";
import { routeMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/map">) {
  return { ...(await routeMetadata(params, "/map", "map", "mapDescription")) };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
