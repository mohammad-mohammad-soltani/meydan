"use client";

import { Bookmark, BookmarkCheck, Check, FileText, Link2, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { meydanApi } from "@/lib/meydan-api";
import type { SharePost } from "../types";
import { StoryStudio } from "./StoryStudio";
import { announceBookmark } from "@/features/feed/bookmark-sync";

type Messenger = { id: string; label: string; color: string; href?: (url: string, text: string) => string; web?: string };

/**
 * Telegram, WhatsApp and X take a prefilled link. Eitaa, Bale and Rubika have
 * no public web share link, so they go through the system share sheet (which
 * lists them on phones) or copy the link and open their web app.
 */
const MESSENGERS: Messenger[] = [
  { id: "eitaa", label: "ایتا", color: "#e8590c", web: "https://web.eitaa.com/" },
  { id: "bale", label: "بله", color: "#0b9f74", web: "https://web.bale.ai/" },
  { id: "rubika", label: "روبیکا", color: "#9333ea", web: "https://web.rubika.ir/" },
  { id: "telegram", label: "تلگرام", color: "#0ea5e9", href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: "whatsapp", label: "واتساپ", color: "#16a34a", href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` },
  { id: "x", label: "X", color: "#000000", href: (url, text) => `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
];

type ApiConversation = { id: number | string; participant?: { name?: string; avatar_url?: string | null } | null };

/** The reference design's share sheet. Opening it costs at most two small reads (recent chats, saved state), both for signed-in viewers only. */
export function ShareSheet({ post, onClose }: { post: SharePost; onClose: () => void }) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [studioOpen, setStudioOpen] = useState(false);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; avatarUrl?: string }> | null>(isAuthenticated ? null : []);
  const [sent, setSent] = useState<Record<string, "sending" | "sent" | "failed">>({});
  const [saved, setSaved] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");
  const countedRef = useRef(false);

  const url = `${window.location.origin}/posts/${post.id}`;
  const shareText = post.title ?? `${post.authorName}: ${post.body.slice(0, 120)}`;

  /** The share counter goes up once per sheet, on the first real share action. */
  const countShare = useCallback(() => {
    if (countedRef.current) return;
    countedRef.current = true;
    void meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
  }, [post.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void meydanApi<ApiConversation[]>("/chat/conversations?limit=4")
      .then((rows) => {
        if (!active) return;
        setContacts(
          (rows ?? []).slice(0, 4).map((row) => ({
            id: String(row.id),
            name: row.participant?.name || "گفتگو",
            avatarUrl: row.participant?.avatar_url || undefined,
          })),
        );
      })
      .catch(() => active && setContacts([]));
    void meydanApi<{ bookmarked?: boolean }>(`/narratives/${post.id}/bookmark`)
      .then((state) => active && setSaved(Boolean(state.bookmarked)))
      .catch(() => active && setSaved(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated, post.id]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !studioOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, studioOpen]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash("پیوند روایت کپی شد");
      countShare();
    } catch {
      flash("کپی پیوند انجام نشد");
    }
  };

  const openMessenger = async (messenger: Messenger) => {
    countShare();
    if (messenger.href) {
      window.open(messenger.href(url, shareText), "_blank", "noopener,noreferrer");
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareText, text: shareText, url });
        return;
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      flash(`پیوند کپی شد؛ در ${messenger.label} بچسبانید`);
    } catch {
      flash("کپی پیوند انجام نشد");
    }
    if (messenger.web) window.open(messenger.web, "_blank", "noopener,noreferrer");
  };

  const sendTo = async (contactId: string) => {
    if (sent[contactId] === "sending" || sent[contactId] === "sent") return;
    setSent((current) => ({ ...current, [contactId]: "sending" }));
    try {
      await meydanApi(`/chat/conversations/${contactId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: crypto.randomUUID(), body: `${shareText}\n${url}` }),
      });
      setSent((current) => ({ ...current, [contactId]: "sent" }));
      countShare();
    } catch {
      setSent((current) => ({ ...current, [contactId]: "failed" }));
    }
  };

  const toggleSaved = async () => {
    if (!requireAuth(`/posts/${post.id}`)) return;
    const next = !saved;
    setSaved(next);
    try {
      await meydanApi(`/narratives/${post.id}/bookmark`, { method: next ? "PUT" : "DELETE" });
      announceBookmark({ id: post.id, bookmarked: next });
      flash(next ? "روایت ذخیره شد؛ در «نشان‌شده‌ها» می‌بینید" : "از ذخیره‌ها برداشته شد");
    } catch {
      setSaved(!next);
      flash("ذخیره روایت انجام نشد");
    }
  };

  if (studioOpen) {
    return createPortal(<StoryStudio post={post} onClose={() => setStudioOpen(false)} onShared={countShare} />, document.body);
  }

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center">
      <button type="button" tabIndex={-1} aria-label="بستن" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-label="اشتراک‌گذاری روایت" className="relative w-full max-w-lg rounded-t-[2rem] border border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-dialog sm:rounded-[2rem]">
        <span aria-hidden="true" className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border-strong sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-divider pb-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-foreground">{post.title || post.body.slice(0, 60) || "روایت"}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{post.authorName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-foreground hover:bg-hover">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {isAuthenticated ? (
          <section className="border-b border-divider py-4">
            <h3 className="mb-3 text-xs font-black text-foreground-secondary">ارسال سریع به مخاطبین</h3>
            {contacts === null ? (
              <LoaderCircle aria-label="در حال دریافت مخاطبین" className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : contacts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">هنوز گفتگویی ندارید.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {contacts.map((contact) => {
                  const state = sent[contact.id];
                  return (
                    <button key={contact.id} type="button" onClick={() => void sendTo(contact.id)} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                      <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-emphasis text-sm font-black text-emphasis-foreground">
                        {contact.avatarUrl ? <OptimizedAvatar src={contact.avatarUrl} alt="" width={56} className="h-full w-full object-cover" /> : contact.name.charAt(0)}
                        {state ? (
                          <span className="absolute inset-0 grid place-items-center bg-black/55 text-white">
                            {state === "sending" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : state === "sent" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          </span>
                        ) : null}
                      </span>
                      <span className="w-full truncate text-[10px] font-bold text-foreground-secondary">{state === "sent" ? "ارسال شد" : state === "failed" ? "ناموفق" : contact.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        <section className="border-b border-divider py-4">
          <h3 className="mb-3 text-xs font-black text-foreground-secondary">اشتراک در پیام‌رسان‌ها</h3>
          <div className="grid grid-cols-6 gap-2">
            {MESSENGERS.map((messenger) => (
              <button key={messenger.id} type="button" onClick={() => void openMessenger(messenger)} className="flex flex-col items-center gap-1.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-[11px] font-black text-white" style={{ backgroundColor: messenger.color }}>
                  {messenger.label}
                </span>
                <span className="text-[10px] font-bold text-foreground-secondary">{messenger.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 pt-4">
          <button type="button" onClick={() => void copyLink()} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-muted py-3 text-xs font-bold text-foreground hover:bg-hover">
            <Link2 aria-hidden="true" className="h-5 w-5" />
            کپی پیوند
          </button>
          <button type="button" onClick={() => setStudioOpen(true)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-muted py-3 text-xs font-bold text-foreground hover:bg-hover">
            <FileText aria-hidden="true" className="h-5 w-5" />
            عکس‌نوشت ساز
          </button>
          <button type="button" onClick={() => void toggleSaved()} aria-pressed={Boolean(saved)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-muted py-3 text-xs font-bold text-foreground hover:bg-hover">
            {saved ? <BookmarkCheck aria-hidden="true" className="h-5 w-5" /> : <Bookmark aria-hidden="true" className="h-5 w-5" />}
            {saved ? "ذخیره شد" : "ذخیره روایت"}
          </button>
        </div>

        <p role="status" aria-live="polite" className={`mt-3 text-center text-[11px] font-bold text-foreground transition-opacity ${notice ? "opacity-100" : "opacity-0"}`}>
          {notice || " "}
        </p>
      </div>
    </div>,
    document.body,
  );
}

