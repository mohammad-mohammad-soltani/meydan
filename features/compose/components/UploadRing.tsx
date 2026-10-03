"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { UploadLive } from "../hooks/useComposeMedia";

const R = 20;
const CIRCUMFERENCE = 2 * Math.PI * R;
const number = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

function size(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${number.format(bytes / 1024 ** 3)} گیگابایت`;
  if (bytes >= 1024 * 1024) return `${number.format(bytes / 1024 ** 2)} مگابایت`;
  return `${number.format(Math.max(1, bytes / 1024))} کیلوبایت`;
}

/**
 * Telegram-style transfer indicator: a ring that fills as bytes leave the
 * device, a cancel cross inside it, and "42٪ · 4.2 of 12.8 MB" beneath.
 *
 * The network reports progress in uneven jumps, so the ring follows the real
 * value through a time-based ease and never moves backwards. It is driven by
 * one requestAnimationFrame loop that writes straight to the DOM — no React
 * render per frame — and stops when the component unmounts.
 */
export function UploadRing({ live, processing, onCancel, label }: { live: UploadLive; processing: boolean; onCancel: () => void; label: string }) {
  const arc = useRef<SVGCircleElement>(null);
  const spinner = useRef<SVGGElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const sizeText = useRef<HTMLSpanElement>(null);
  const speedText = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let shown = 0;
    let previous = performance.now();
    let lastText = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      const total = Math.max(1, live.total);
      // Between two network events keep moving at the measured speed, but never run far ahead of what was confirmed.
      const ahead = Math.min(Math.max(0, now - live.at) / 1000, 0.35) * live.speed;
      const target = live.phase === "processing" ? total : Math.min(total * 0.995, live.loaded + ahead);
      shown = Math.max(shown, shown + (target - shown) * (1 - Math.exp(-dt / 0.22)));
      const fraction = Math.min(1, shown / total);
      if (arc.current) {
        const visible = live.phase === "processing" ? 0.28 : Math.max(0.04, fraction);
        arc.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - visible));
      }
      if (now - lastText > 180) {
        lastText = now;
        if (text.current) {
          text.current.textContent =
            live.phase === "processing" ? "در حال پردازش…" : `${percent.format(fraction * 100)}٪`;
        }
        if (sizeText.current) {
          sizeText.current.textContent = live.phase === "processing" ? "" : `${size(shown)} از ${size(total)}`;
        }
        if (speedText.current) {
          speedText.current.textContent = live.phase === "uploading" && live.speed > 0 ? `${size(live.speed)} در ثانیه` : "";
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [live]);

  return (
    <div className="absolute inset-0 grid place-content-center justify-items-center gap-1.5 bg-scrim/45 p-2">
      <button
        type="button"
        onClick={onCancel}
        aria-label={`لغو بارگذاری ${label}`}
        className="relative grid size-12 place-items-center rounded-full bg-scrim/70 text-on-solid backdrop-blur-sm transition-transform active:scale-90"
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="3" />
          <g ref={spinner} className={processing ? "origin-center animate-spin [animation-duration:1.1s] motion-reduce:animate-none" : "origin-center animate-spin [animation-duration:3.2s] motion-reduce:animate-none"}>
            <circle
              ref={arc}
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * 0.96}
            />
          </g>
        </svg>
        <X aria-hidden="true" className="relative size-4" />
      </button>
      <span role="status" aria-live="off" className="max-w-full rounded-pill bg-scrim/70 px-2.5 py-1 text-center text-[10px] font-bold leading-4 text-on-solid backdrop-blur-sm">
        <span ref={text} className="block truncate text-xs font-black">در حال آماده‌سازی…</span>
        <span ref={sizeText} className="block truncate" />
        <span ref={speedText} className="block truncate text-[9px] font-medium opacity-75" />
      </span>
    </div>
  );
}
