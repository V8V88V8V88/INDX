import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "overlay";
type Size = "sm" | "md";

interface StyleOptions {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  pressed?: boolean;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary: "bg-accent-primary text-white shadow-sm hover:bg-accent-primary/90",
  secondary: "border border-border-light bg-bg-card text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
  ghost: "text-text-tertiary hover:text-text-primary",
  overlay: "border border-border-light bg-bg-card/90 text-text-secondary shadow-sm backdrop-blur-sm hover:bg-bg-secondary hover:text-text-primary",
};

const pressedStyle = "border border-accent-primary bg-accent-primary text-white shadow-sm";

const sizes: Record<Size, { text: string; icon: string }> = {
  sm: { text: "h-8 gap-1.5 px-3 text-xs", icon: "h-8 w-8" },
  md: { text: "h-9 gap-2 px-4 text-sm", icon: "h-9 w-9" },
};

export function buttonStyles({ variant = "secondary", size = "md", iconOnly, pressed, className }: StyleOptions = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    iconOnly ? sizes[size].icon : sizes[size].text,
    pressed ? pressedStyle : variants[variant],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<StyleOptions, "className">;

export function Button({ variant, size, iconOnly, pressed, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={buttonStyles({ variant, size, iconOnly, pressed, className })}
      {...props}
    />
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & Omit<StyleOptions, "className" | "pressed">;

export function LinkButton({ variant, size, iconOnly, className, ...props }: LinkButtonProps) {
  return <Link className={buttonStyles({ variant, size, iconOnly, className })} {...props} />;
}
