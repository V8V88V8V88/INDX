"use client";

import { motion } from "framer-motion";

// CSS Styles injected locally to ensure 60fps performance on the compositor thread
// independent of the main JS thread (which may be blocked by hydration).
const css = `
@keyframes pulse-core {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.8; border-width: 2px; }
  100% { transform: scale(4); opacity: 0; border-width: 0px; }
}

@keyframes ripple-large {
  0% { transform: scale(1); opacity: 0.6; border-width: 2px; }
  100% { transform: scale(6); opacity: 0; border-width: 0px; }
}

@keyframes text-shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

.animate-pulse-core {
  animation: pulse-core 1.2s ease-in-out infinite;
  will-change: transform, opacity;
}

.animate-ripple {
  animation: ripple 1.2s ease-out infinite;
  will-change: transform, opacity;
}

.animate-ripple-large {
  animation: ripple-large 1.2s ease-out infinite;
  animation-delay: 0.2s;
  will-change: transform, opacity;
}

.animate-text {
  animation: text-shimmer 1.2s ease-in-out infinite;
}
`;

export function PageLoader() {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary"
        >
            <style>{css}</style>
            <div className="flex flex-col items-center gap-8">
                <div className="relative flex items-center justify-center">
                    {/* Core */}
                    <div className="animate-pulse-core relative z-10 h-3 w-3 rounded-full bg-accent-primary shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.5)]" />

                    {/* Inner Ripple */}
                    <div className="animate-ripple absolute h-3 w-3 rounded-full border border-accent-primary/50" />

                    {/* Outer Ripple */}
                    <div className="animate-ripple-large absolute h-3 w-3 rounded-full border border-accent-primary/30" />
                </div>

                {/* Brand Text */}
                <div className="animate-text text-sm font-medium tracking-[0.2em] text-accent-primary uppercase">
                    INDX
                </div>
            </div>
        </motion.div>
    );
}
