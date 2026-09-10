"use client";

import Image from "next/image";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";

type CommentInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  avatarLabel: string;
};

export function CommentInput({ value, onChange, onSubmit, avatarLabel }: CommentInputProps) {
  const [avatarUrl, setAvatarUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void meydanApi<{ account_type: "user" | "square"; profile?: { avatar_url?: string }; square?: { avatar_url?: string } }>("/me")
      .then((me) => setAvatarUrl(me.account_type === "square" ? me.square?.avatar_url || "" : me.profile?.avatar_url || ""))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="sticky bottom-0 z-30 border-t border-divider bg-background/85 px-3 py-3 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={36} height={36} unoptimized={avatarUrl.startsWith("http")} className="mb-1 h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-[11px] font-bold">{avatarLabel}</span>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          placeholder="پاسخ خود را بنویسید..."
          className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-placeholder"
        />

        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="ارسال پاسخ"
          className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-transform active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
