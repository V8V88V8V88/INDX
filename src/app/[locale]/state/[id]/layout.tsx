import type { ReactNode } from "react";
import { states } from "@/data/india";

export function generateStaticParams() {
  return states.map((state) => ({ id: state.id }));
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
