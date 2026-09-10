"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";

type CommentInputProps = { value: string; onChange: (value: string) => void; onSubmit: () => void; avatarLabel: string; };

export function CommentInput({ value, onChange, onSubmit, avatarLabel }: CommentInputProps) {
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    void meydanApi<{ account_type: "user" | "square"; profile?: { avatar_url?: string }; square?: { avatar_url?: string } }>("/me")
      .then((me) => setAvatarUrl(me.account_type === "square" ? me.square?.avatar_url || "" : me.profile?.avatar_url || ""))
      .catch(() => undefined);
  }, []);

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-background/90 px-3 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        {avatarUrl ? <Image src={avatarUrl} alt="" width={34} height={34} unoptimized={avatarUrl.startsWith("http")} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-[11px] font-bold">{avatarLabel}</span>}
        <textarea value={value} rows={1} onChange={(event) => onChange(event.target.value)} placeholder="پاسخ خود را بنویسید" className="max-h-24 min-h-9 flex-1 resize-none rounded-full bg-surface-muted px-4 py-2 text-xs text-foreground outline-none placeholder:text-placeholder" />
        <button type="submit" disabled={!value.trim()} className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-foreground disabled:opacity-50">ارسال</button>
      </div>
    </form>
  );
}
