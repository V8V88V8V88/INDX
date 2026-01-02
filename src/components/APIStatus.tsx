"use client";

import { useEffect, useState } from "react";
import { checkAPIStatus } from "@/lib/api";

export function APIStatus() {
  const [status, setStatus] = useState<{ connected: boolean; message: string } | null>(null);

  useEffect(() => {
    checkAPIStatus().then(setStatus);
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          status.connected ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      <span className="text-text-muted">
        {status.connected ? "Live API" : "Local data"}
      </span>
    </div>
  );
}

