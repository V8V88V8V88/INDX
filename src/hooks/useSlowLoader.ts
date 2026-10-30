"use client";

import { useEffect, useState } from "react";

export function useSlowLoader(ready: boolean, delay = 400) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setSlow(true), delay);
    return () => clearTimeout(timer);
  }, [ready, delay]);

  return !ready && slow;
}
