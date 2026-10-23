"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  trigger?: boolean;
  plain?: boolean;
}

export function Card({ children, className, delay = 0, trigger = true, plain }: CardProps) {
  const reduceMotion = useReducedMotion();
  const hidden = { opacity: 0, y: 20 };

  return (
    <motion.div
      initial={reduceMotion ? false : hidden}
      animate={trigger ? { opacity: 1, y: 0 } : hidden}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={cn(!plain && "card p-6", className)}
    >
      {children}
    </motion.div>
  );
}
