import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "accent" | "soft" | "outline" | "neutral";

const variants: Record<Variant, string> = {
  accent: "bg-accent-primary text-white",
  soft: "bg-accent-primary/15 text-accent-primary",
  outline: "border border-accent-primary/50 text-accent-primary",
  neutral: "bg-bg-tertiary text-text-secondary",
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
