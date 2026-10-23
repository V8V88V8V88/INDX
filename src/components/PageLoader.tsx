"use client";

import { motion } from "framer-motion";
import { Wordmark } from "./ui";

const css = `
@keyframes loader-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
.loader-dot {
  animation: loader-dot 1.6s ease-in-out infinite;
  will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
  .loader-dot { animation: none; }
}
`;

export function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary"
      role="status"
      aria-label="Loading"
    >
      <style>{css}</style>
      <Wordmark className="w-28 text-text-primary" dotClassName="loader-dot" />
    </motion.div>
  );
}
