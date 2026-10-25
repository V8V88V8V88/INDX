"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Icon } from "./ui";

const VISIBLE_MS = 5000;

export function SourcesInfo({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className={className}>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => setOpen((o) => !o)}
          title="Data sources"
          aria-label="Data sources"
          aria-expanded={open}
        >
          <Icon name="info" size={14} />
        </Button>
        {open && (
          <div
            role="status"
            className="absolute bottom-full right-0 z-20 mb-2 w-72 rounded-xl border border-border-light bg-bg-card/95 p-3 text-xs leading-relaxed text-text-secondary shadow-lg backdrop-blur-md"
          >
            {children}{" "}
            <Link href="/about" className="text-text-primary underline-offset-2 hover:underline">
              All sources
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
