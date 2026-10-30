"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EASE_OUT, FADE_DURATION } from "@/lib/motion";

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  trigger?: boolean;
  plain?: boolean;
}

export function Card({ children, className, delay = 0, trigger = true, plain }: CardProps) {
  const reduceMotion = useReducedMotion();
  const hidden = { opacity: 0 };

  return (
    <motion.div
      initial={reduceMotion ? false : hidden}
      animate={trigger ? { opacity: 1 } : hidden}
      transition={reduceMotion ? { duration: 0 } : { duration: FADE_DURATION, ease: EASE_OUT, delay }}
      className={cn(!plain && "card p-6", className)}
    >
      {children}
    </motion.div>
  );
}
