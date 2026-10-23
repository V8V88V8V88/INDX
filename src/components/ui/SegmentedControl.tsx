import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-7 min-w-7 px-3 text-xs",
  md: "h-9 min-w-9 px-4 text-sm",
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  fullWidth,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex-wrap items-center gap-1 rounded-full border border-border-light bg-bg-secondary p-1",
        fullWidth ? "flex w-full" : "inline-flex",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.title}
            aria-label={option.title}
            aria-pressed={selected}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-medium transition-colors",
              sizes[size],
              fullWidth && "flex-1",
              selected ? "bg-accent-primary text-white shadow-sm" : "text-text-muted hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
