"use client";

import Image from "next/image";
import { useEffect } from "react";
import { generatedMedia } from "@/components/shared/generated-media";

type CommentInputProps = { value: string; onChange: (value: string) => void; onSubmit: () => void; };

export function CommentInput({ value, onChange, onSubmit }: CommentInputProps) {
  const remaining = 280 - value.length;

  useEffect(() => {
    if (window.location.hash !== "#comment-composer") return;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => document.getElementById("comment-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <form id="comment-composer" onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="scroll-mt-20 rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
      <div className="flex items-start gap-3">
        <Image src={generatedMedia.avatarCoordinator} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <textarea value={value} maxLength={280} rows={2} onChange={(event) => onChange(event.target.value)} placeholder="پاسخ خود را بنویسید" className="min-h-16 w-full resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-placeholder focus-visible:outline-none" />
          <div className="flex items-center justify-end border-t border-divider pt-2">
            <div className="flex items-center gap-2"><span className={remaining < 20 ? "text-[10px] text-danger" : "text-[10px] text-foreground-subtle"}>{remaining}</span><button type="submit" disabled={!value.trim()} className="rounded-pill bg-brand px-4 py-2 text-xs font-bold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground">پاسخ</button></div>
          </div>
        </div>
      </div>
    </form>
  );
}
