"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/** A short-lived confirmation that does not change the editor's grid layout. */
export function AdminSuccessToast({ message, durationMs = 4000 }: {
  message: string;
  durationMs?: number;
}) {
  const [phase, setPhase] = useState<"open" | "closing" | "hidden">("open");

  useEffect(() => {
    if (phase !== "open") return;
    const timer = window.setTimeout(() => setPhase("closing"), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, phase]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("hidden"), 240);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div role="status" aria-live="polite" className={`admin-success-toast ${phase === "closing" ? "admin-success-toast-exit" : ""}`}>
      <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-success" />
      <span className="min-w-0 flex-1">{message}</span>
      <button type="button" aria-label="بستن پیام" onClick={() => setPhase("closing")} className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-muted-foreground hover:bg-hover hover:text-foreground">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
