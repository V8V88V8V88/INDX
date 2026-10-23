import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LinkButton } from "./Button";
import { Icon } from "./Icon";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md bg-bg-secondary px-1.5 py-0.5 font-mono text-xs text-text-muted">
      {children}
    </kbd>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"
    />
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-xs font-semibold uppercase tracking-wider text-text-muted", className)}>
      {children}
    </h3>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-headline text-text-primary">{title}</h2>
        {description && <p className="mt-1 text-text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

const statSizes = {
  sm: "text-base font-semibold",
  md: "text-lg font-semibold",
  lg: "text-2xl font-bold",
};

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  size?: keyof typeof statSizes;
  className?: string;
}

export function Stat({ label, value, hint, size = "md", className }: StatProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className={cn("mt-1 truncate text-text-primary", statSizes[size])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export function BackLink({ href = "/", label = "Back to India" }: { href?: string; label?: string }) {
  return (
    <LinkButton href={href} variant="secondary">
      <Icon name="arrow-left" />
      {label}
    </LinkButton>
  );
}

interface CursorTooltipProps {
  x: number;
  y: number;
  children: ReactNode;
}

export function CursorTooltip({ x, y, children }: CursorTooltipProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg bg-text-primary px-2.5 py-1.5 text-xs font-medium text-bg-primary shadow-lg"
      style={{ left: x + 12, top: y - 12 }}
    >
      {children}
    </div>
  );
}
