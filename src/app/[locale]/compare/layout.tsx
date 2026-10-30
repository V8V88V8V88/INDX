import type { ReactNode } from "react";
import { routeMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/compare">) {
  return { ...(await routeMetadata(params, "/compare", "compare", "compareDescription")) };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
