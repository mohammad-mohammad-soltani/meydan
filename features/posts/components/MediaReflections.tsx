"use client";

import { ExternalLink, Newspaper, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MediaReflection } from "../types";

const PREVIEW_LIMIT = 3;

function OutletAvatar({ reflection }: { reflection: MediaReflection }) {
  const letter = reflection.outlet.trim().charAt(0) || "خ";

  return (
    <span
      aria-hidden="true"
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-black text-foreground"
    >
      {letter}

      {reflection.avatarUrl ? (
        <img
          src={reflection.avatarUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}

function ReflectionContent({ reflection }: { reflection: MediaReflection }) {
  const title = reflection.title || reflection.summary || "مشاهده بازتاب رسانه‌ای";

  return (
    <>
      <OutletAvatar reflection={reflection} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <strong className="truncate text-[13px] font-black leading-5 text-foreground">
            {reflection.outlet}
          </strong>

          {reflection.url ? (
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-icon-muted" />
          ) : null}
        </div>

        <p
          className="mt-0.5 truncate text-[12px] leading-5 text-muted-foreground"
          title={title}
        >
          {title}
        </p>
      </div>
    </>
  );
}

function ReflectionRow({
  reflection,
  compact = false,
}: {
  reflection: MediaReflection;
  compact?: boolean;
}) {
  const className = `
    flex
    w-full
    items-center
    gap-3
    text-right
    ${compact ? "px-3 py-2.5" : "px-4 py-3"}
    ${reflection.url ? "transition-colors hover:bg-hover active:bg-muted" : ""}
  `;

  if (reflection.url) {
    return (
      <a
        href={reflection.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <ReflectionContent reflection={reflection} />
      </a>
    );
  }

  return (
    <article className={className}>
      <ReflectionContent reflection={reflection} />
    </article>
  );
}

function ReflectionsModal({
  reflections,
  onClose,
}: {
  reflections: MediaReflection[];
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-reflections-title"
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[82dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-border bg-background shadow-2xl sm:max-w-xl sm:rounded-[24px]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-divider bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Newspaper className="h-4 w-4 text-foreground" />
            </span>

            <div className="min-w-0">
              <h2 id="media-reflections-title" className="text-sm font-black text-foreground">
                همه بازتاب‌های رسانه‌ای
              </h2>
              <p className="mt-0.5 text-[11px] text-foreground-subtle">
                {reflections.length.toLocaleString("fa-IR")} بازنشر
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="divide-y divide-divider">
            {reflections.map((reflection) => (
              <ReflectionRow key={reflection.id} reflection={reflection} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function MediaReflections({ reflections }: { reflections: MediaReflection[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const previewItems = useMemo(
    () => reflections.slice(0, PREVIEW_LIMIT),
    [reflections],
  );

  const hasMore = reflections.length > PREVIEW_LIMIT;

  if (!reflections.length) return null;

  return (
    <>
      <section
        aria-labelledby="media-reflections-heading"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
      >
        <header className="flex items-center justify-between gap-3 border-b border-divider px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Newspaper className="h-4 w-4 text-foreground" />
            </span>

            <div className="min-w-0">
              <h2
                id="media-reflections-heading"
                className="truncate text-[13px] font-black text-foreground"
              >
                بازتاب رسانه‌ای
              </h2>
              <p className="mt-0.5 text-[10px] text-foreground-subtle">
                بازنشر در خبرگزاری‌ها و رسانه‌ها
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-foreground-secondary">
            {reflections.length.toLocaleString("fa-IR")}
          </span>
        </header>

        <div className="relative">
          <div className="divide-y divide-divider">
            {previewItems.map((reflection) => (
              <ReflectionRow key={reflection.id} reflection={reflection} compact />
            ))}
          </div>

          {hasMore ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent via-card/75 to-card"
            />
          ) : null}
        </div>

        {hasMore ? (
          <div className="relative border-t border-divider bg-card px-3 pb-3 pt-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex min-h-10 w-full items-center justify-center rounded-xl bg-muted px-4 text-xs font-black text-foreground transition-all hover:bg-hover active:scale-[0.99]"
            >
              مشاهده همه
              <span className="mr-1.5 font-normal text-foreground-subtle">
                ({reflections.length.toLocaleString("fa-IR")})
              </span>
            </button>
          </div>
        ) : null}
      </section>

      {isOpen ? (
        <ReflectionsModal reflections={reflections} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
