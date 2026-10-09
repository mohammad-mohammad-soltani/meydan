"use client";

import { useCallback, useEffect, useState, type MouseEvent, type SVGProps } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./memorial-badge.css";
import { MEMORIAL_BADGE } from "./memorial-badge-content";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;


function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 103.6 103.6" aria-hidden="true" {...props}>
      <path className="fill-foreground" d="M51.8,1.7C25.5,1.7,3.9,22,1.8,47.8c-0.1,1.3-0.2,2.7-0.2,4.1c0,1,0,2,0.1,3C3.3,81.1,25.2,102,51.8,102 c27.7,0,50.2-22.5,50.2-50.2S79.5,1.7,51.8,1.7z M51.8,95.1c-22.1,0-40.3-16.5-43-37.9c6.1,2,14.9,4.7,17.2,5.1 c2.5,0.5,4.9,0.7,7.4,0.7c0.9,0,1.7,0,2.6-0.1c3.3-0.2,6.5-1,9.5-2.2c1.4-0.6,2.7-1.3,3.9-2.3c-0.1,2.6,0.6,5.1,2.2,7.7 c3.3,5.4,12.9,15.5,21.6,23.2C66.9,93,59.6,95.1,51.8,95.1z M80.4,84.3c-8.1-6.9-17.2-16.2-19.7-20c-4.5-6.7-4.9-12.8-4.2-16.1 c0-0.1,0-0.1,0-0.2c0-0.1,0-0.2,0.1-0.3c0,0,0,0,0,0c0.1-0.5,0.2-1,0.3-1.5c0.2-0.5,0.3-0.9,0.5-1.3c0.1-0.4,0.2-0.7,0.3-0.9 c0.1-0.2,0.1-0.4-0.1-0.5c-0.1-0.1-0.3,0-0.7,0.1c-0.4,0.2-0.8,0.4-1.2,0.6c-0.4,0.2-0.9,0.5-1.3,0.7c-0.4,0.2-0.7,0.4-0.9,0.6 c-0.3,0.2-0.6,0.5-0.9,0.7c-0.3,0.3-0.7,0.7-1.1,1.4c-0.2,0.2-0.3,0.5-0.5,0.8c-0.1,0-0.2,0.1-0.2,0.1c-0.3,0.9-1.2,2.3-1.6,3.4 c-0.4,1.1-1.1,2.2-2.1,3.4c-0.7,0.8-1.8,1.5-3.4,2c-1.3,0.4-2.8,0.5-4.6,0.5c-0.5,0-1,0-1.6,0c-2.5-0.1-5.5-0.6-9-1.4 c-2.6-0.6-13.2-4-20.1-6.3c0-0.4,0-0.8,0.1-1.2c1.4,0.5,2.8,1,4.2,1.6c2.8,1,5.9,1.9,9.2,2.5c2.5,0.5,4.9,0.7,7.4,0.7 c0.9,0,1.7,0,2.6-0.1c3.3-0.2,6.5-1,9.5-2.2c3-1.3,5.6-3.3,7.8-6c0.4-0.5,0.8-1.1,1.1-1.7c0.3-0.6,0.6-1.2,0.9-1.8 c0.3-0.6,0.6-1.2,0.9-1.7c0.3-0.6,0.6-1.1,1-1.6c0.2-0.3,0.4-0.5,0.6-0.7c0.2-0.2,0.3-0.3,0.5-0.4c0.2-0.1,0.4-0.2,0.6-0.2 c0.2,0,0.4,0,0.6,0c0.1,0,0.1,0,0.2,0c1.1,0,2.1,0.2,3,0.4c0.9,0.2,1.8,0.4,2.6,0.6c0.6,0.2,1.2,0.4,1.9,0.6 c0.7,0.2,1.1,0.4,1.3,0.6c0.2,0.2,0.2,0.4-0.1,0.8c0,0-10.3,11.2-3.4,22.5c3.7,6,10.8,13.2,20.2,20.9 C81,83.8,80.7,84.1,80.4,84.3z M87,77.1c-8.2-6.7-14.1-12.4-16.7-16.4c-6.1-9.2-3.9-15.4-2.8-17.6c0.2-0.3,0.3-0.5,0.5-0.8 c0.6-1.3,1.5-2.6,2.7-4.1c0.8-1.1,1.6-1.9,2.2-2.6c0.6-0.7,1-1.1,1.2-1.3c0-0.1,0.1-0.1,0.1-0.2c0-0.1-0.1-0.2-0.2-0.3 c-0.2-0.1-0.4-0.2-0.7-0.3c-0.3-0.1-0.7-0.2-1.3-0.4c-0.5-0.2-1.2-0.4-2.1-0.6c-0.8-0.2-1.9-0.6-3.2-1c-0.4-0.1-0.9-0.3-1.4-0.5 c-0.5-0.2-1.1-0.3-1.7-0.5c-0.6-0.2-1.2-0.3-1.7-0.5c-0.6-0.2-1.1-0.3-1.6-0.4c-0.3-0.1-0.7-0.1-1-0.1c-0.3,0-0.5,0-0.8,0.1 c-0.5,0.1-1.1,0.3-1.6,0.6c-0.8,0.3-1.6,0.7-2.5,1c-0.9,0.4-1.7,0.7-2.5,1.2c-0.8,0.4-1.5,0.8-2.2,1.3c-0.7,0.5-1.2,0.9-1.6,1.4 c-0.5,0.6-0.9,1.3-1.1,2.1c-0.2,0.7-0.4,1.6-0.7,2.5c-0.3,0.9-0.6,1.9-1.1,2.9c-0.4,1.1-1.1,2.2-2.1,3.4c-0.7,0.8-1.8,1.5-3.4,2 c-1.3,0.4-2.8,0.5-4.6,0.5c-0.5,0-1,0-1.6,0c-2.5-0.1-5.5-0.6-9-1.4c-3.5-0.8-7.4-2-11.7-3.6c-1.1-0.4-2.2-0.8-3.4-1.2 C14,22.9,31.2,8.5,51.8,8.5c23.9,0,43.3,19.4,43.3,43.3C95.1,61.3,92.1,70,87,77.1z" />
        <g fill="#BD1824">
      <path d="M51.8,8.5C31.2,8.5,14,22.9,9.6,42.2c1.1,0.4,2.3,0.8,3.4,1.2c4.4,1.6,8.3,2.8,11.7,3.6c3.5,0.8,6.4,1.2,9,1.4 c0.5,0,1.1,0,1.6,0c1.8,0,3.4-0.2,4.6-0.5c1.6-0.5,2.7-1.1,3.4-2c1-1.2,1.7-2.3,2.1-3.4c0.4-1,0.8-2,1.1-2.9 c0.3-0.9,0.5-1.7,0.7-2.5c0.2-0.7,0.6-1.4,1.1-2.1c0.4-0.5,0.9-1,1.6-1.4c0.7-0.5,1.4-0.9,2.2-1.3c0.8-0.4,1.6-0.8,2.5-1.2 c0.9-0.4,1.7-0.7,2.5-1c0.5-0.3,1.1-0.5,1.6-0.6c0.2-0.1,0.5-0.1,0.8-0.1c0.3,0,0.6,0,1,0.1c0.5,0.1,1,0.2,1.6,0.4 c0.6,0.2,1.1,0.3,1.7,0.5c0.6,0.2,1.1,0.3,1.7,0.5c0.5,0.2,1,0.3,1.4,0.5c1.3,0.4,2.3,0.8,3.2,1c0.8,0.2,1.5,0.4,2.1,0.6 c0.5,0.2,1,0.3,1.3,0.4c0.3,0.1,0.5,0.2,0.7,0.3c0.2,0.1,0.2,0.2,0.2,0.3c0,0.1,0,0.2-0.1,0.2c-0.1,0.2-0.5,0.6-1.2,1.3 c-0.6,0.7-1.4,1.5-2.2,2.6c-1.2,1.5-2.1,2.9-2.7,4.1c-0.1,0.3-0.3,0.5-0.5,0.8c-1.1,2.1-3.3,8.4,2.8,17.6c2.7,4,8.5,9.7,16.7,16.4 c5.1-7.1,8.2-15.8,8.2-25.3C95.1,27.9,75.7,8.5,51.8,8.5z" />
      <path d="M61.1,62.5C54.2,51.2,64.5,40,64.5,40c0.3-0.3,0.3-0.6,0.1-0.8c-0.2-0.2-0.7-0.4-1.3-0.6 c-0.7-0.2-1.3-0.4-1.9-0.6c-0.8-0.2-1.6-0.4-2.6-0.6c-0.9-0.2-2-0.4-3-0.4c-0.1,0-0.1,0-0.2,0c-0.2,0-0.5,0-0.6,0 c-0.2,0-0.4,0.1-0.6,0.2c-0.2,0.1-0.3,0.2-0.5,0.4c-0.2,0.2-0.4,0.4-0.6,0.7c-0.4,0.5-0.8,1-1,1.6c-0.3,0.6-0.6,1.1-0.9,1.7 c-0.3,0.6-0.6,1.2-0.9,1.8c-0.3,0.6-0.7,1.1-1.1,1.7c-2.2,2.8-4.8,4.8-7.8,6c-3,1.3-6.2,2-9.5,2.2c-0.9,0.1-1.7,0.1-2.6,0.1 c-2.5,0-4.9-0.2-7.4-0.7c-3.3-0.6-6.4-1.4-9.2-2.5c-1.5-0.5-2.9-1-4.2-1.6c0,0.4,0,0.8-0.1,1.2c7,2.3,17.5,5.7,20.1,6.3 c3.5,0.8,6.4,1.2,9,1.4c0.5,0,1.1,0,1.6,0c1.8,0,3.4-0.2,4.6-0.5c1.6-0.5,2.7-1.1,3.4-2c1-1.2,1.7-2.3,2.1-3.4 c0.4-1,1.4-2.5,1.6-3.4c0,0,0.1-0.1,0.2-0.1c0.2-0.3,0.3-0.5,0.5-0.8c0.4-0.6,0.8-1.1,1.1-1.4c0.3-0.3,0.6-0.5,0.9-0.7 c0.2-0.2,0.5-0.3,0.9-0.6c0.4-0.2,0.9-0.5,1.3-0.7c0.4-0.2,0.8-0.4,1.2-0.6c0.4-0.2,0.6-0.2,0.7-0.1c0.1,0.1,0.2,0.3,0.1,0.5 c-0.1,0.2-0.2,0.5-0.3,0.9c-0.1,0.4-0.3,0.8-0.5,1.3c-0.1,0.5-0.3,0.9-0.3,1.5c0,0,0,0,0,0c0,0.1,0,0.2-0.1,0.3c0,0.1,0,0.1,0,0.2 c-0.7,3.2-0.2,9.3,4.2,16.1c2.5,3.8,11.6,13.1,19.7,20c0.3-0.3,0.6-0.6,1-0.9C72,75.7,64.8,68.5,61.1,62.5z" />
      <path d="M51.6,66.2c-1.6-2.6-2.3-5.2-2.2-7.7c-1.2,0.9-2.5,1.7-3.9,2.3c-3,1.3-6.2,2-9.5,2.2C35.2,63,34.3,63,33.5,63 c-2.5,0-4.9-0.2-7.4-0.7c-2.3-0.4-11.1-3.1-17.2-5.1c2.7,21.4,20.9,37.9,43,37.9c7.8,0,15.1-2.1,21.5-5.7 C64.5,81.7,54.9,71.6,51.6,66.2z" />
      <path d="M51.8,0.8C25.2,0.8,3.2,21.4,1,47.4c-0.1,1.4-0.2,2.9-0.2,4.4c0,0.9,0,1.8,0.1,2.7c1.4,26.9,23.7,48.3,51,48.3 c28.1,0,51-22.9,51-51S80,0.8,51.8,0.8z M51.8,102C25.2,102,3.3,81.1,1.7,54.8c-0.1-1-0.1-2-0.1-3c0-1.4,0.1-2.7,0.2-4.1 C3.9,22,25.5,1.7,51.8,1.7c27.7,0,50.2,22.5,50.2,50.2S79.5,102,51.8,102z" />
        </g>
    </svg>
  );
}

/**
 * The mark every یادبود (memorial) account wears after its name, in place of
 * the verification tick. Its outer ring follows the text colour so it reads on
 * both themes; the red is the brand's own and stays fixed.
 *
 * Pressing it opens a centred popup that explains the mark; the words live in
 * `memorial-badge-content.ts`. The badge sits inside links and cards all over
 * the app, so every event is stopped here before it can open the profile or
 * the post behind it.
 */
export function MemorialBadge({ size = "sm", className = "" }: { size?: keyof typeof sizes; className?: string }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => { setOpen(false); setClosing(false); }, 180);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={MEMORIAL_BADGE.name}
        aria-haspopup="dialog"
        className="inline-flex shrink-0 cursor-pointer"
        onClick={(event) => { swallow(event); setOpen(true); }}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setOpen(true); } }}
      >
        <Mark className={`${sizes[size]} shrink-0 ${className}`} />
      </span>
      {open ? createPortal(
        <div
          data-closing={closing}
          className="mb-backdrop fixed inset-0 z-[300] flex items-center justify-center bg-overlay p-5 backdrop-blur-sm"
          onClick={(event) => { swallow(event); close(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="memorial-badge-title"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
            className="mb-card relative max-h-[86dvh] w-full max-w-sm overflow-y-auto rounded-[28px] border border-border bg-popover px-6 pb-7 pt-9 text-center text-popover-foreground shadow-dialog"
          >
            <button type="button" aria-label="بستن" autoFocus onClick={(event) => { swallow(event); close(); }} className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover">
              <X className="h-5 w-5" />
            </button>
            <Mark className="mb-mark mx-auto h-28 w-28" />
            <h2 id="memorial-badge-title" className="mb-rise mt-5 text-xl font-black" style={{ animationDelay: ".22s" }}>{MEMORIAL_BADGE.name}</h2>
            <div className="mb-rise mt-3 space-y-3 text-[13.5px] leading-[2] text-muted-foreground" style={{ animationDelay: ".3s" }}>
              {MEMORIAL_BADGE.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
