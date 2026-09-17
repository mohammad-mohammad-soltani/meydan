"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Keeps optional form fields mounted, so closing a section never loses edits. */
export function AdminDisclosureSection({
  title,
  description,
  children,
  hasError = false,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  hasError?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || hasError;
  const id = useId();

  return (
    <section aria-label={title} className={`admin-form-card ${className}`}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between gap-3 text-right"
      >
        <span>
          <span className="block text-sm font-black text-foreground">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-icon-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <div id={id} hidden={!expanded} className="admin-form-section-body mt-4 border-t border-divider pt-4">
        {children}
      </div>
    </section>
  );
}
