"use client";

import { Bookmark, BookmarkCheck, Check, FileText, Link2, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { meydanApi } from "@/lib/meydan-api";
import type { SharePost } from "../types";
import { StoryStudio } from "./StoryStudio";
import { announceBookmark } from "@/features/feed/bookmark-sync";
import { createShareCounter } from "../share-counter";
import styles from "../share.module.css";

type Messenger = { id: string; label: string; logo: string; href?: (url: string, text: string) => string; web?: string };

/**
 * Telegram, WhatsApp and X take a prefilled link. Eitaa, Bale and Rubika have
 * no public web share link, so they go through the system share sheet (which
 * lists them on phones) or copy the link and open their web app.
 */
const MESSENGERS: Messenger[] = [
  { id: "eitaa", label: "ایتا", logo: "/images/messengers/eitaa.svg", web: "https://web.eitaa.com/" },
  { id: "bale", label: "بله", logo: "/images/messengers/bale.png", web: "https://web.bale.ai/" },
  { id: "rubika", label: "روبیکا", logo: "/images/messengers/rubika.svg", web: "https://web.rubika.ir/" },
  { id: "telegram", label: "تلگرام", logo: "/images/messengers/telegram.svg", href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: "whatsapp", label: "واتساپ", logo: "/images/messengers/whatsapp.svg", href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` },
  { id: "x", label: "X", logo: "/images/messengers/x.svg", href: (url, text) => `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
];

type ApiConversation = { id: number | string; participant?: { name?: string; avatar_url?: string | null } | null };

/** The reference design's share sheet. Opening it costs at most two small reads (recent chats, saved state), both for signed-in viewers only. */
export function ShareSheet({ post, onClose }: { post: SharePost; onClose: () => void }) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const router = useRouter();
  const [studioOpen, setStudioOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);

  // Swipe-to-dismiss: drag the handle/header down past a third of the sheet
  // (or let the CSS keyframe take over from wherever the drag left off).
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onDragPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (closing) return;
    dragStartRef.current = { y: event.clientY, height: dialogRef.current?.offsetHeight ?? 400 };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onDragPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragStartRef.current) return;
    setDragY(Math.max(0, event.clientY - dragStartRef.current.y));
  };
  const onDragPointerUp = () => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (!start) return;
    setIsDragging(false);
    const shouldClose = dragY > Math.min(160, start.height * 0.3);
    if (shouldClose) {
      dialogRef.current?.style.setProperty("--drag-y", `${dragY}px`);
      requestClose();
    } else {
      setDragY(0);
    }
  };
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; avatarUrl?: string }> | null>(isAuthenticated ? null : []);
  const [contactsError, setContactsError] = useState(false);
  const [sent, setSent] = useState<Record<string, "sending" | "sent" | "failed">>({});
  const [saved, setSaved] = useState<boolean | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [notice, setNotice] = useState("");
  const counterRef = useRef<ReturnType<typeof createShareCounter> | null>(null);
  const saveLock = useRef(false);

  const isContent = post.kind === "content";
  const apiBase = isContent ? `/content/${post.id}` : `/narratives/${post.id}`;
  const pagePath = post.href ?? `/posts/${post.id}`;
  const url = `${window.location.origin}${pagePath}`;
  const shareText = post.title ?? `${post.authorName}: ${post.body.slice(0, 120)}`;

  /** The share counter goes up once per sheet, on the first real share action. */
  const countShare = useCallback(() => {
    if (!counterRef.current) {
      const key = crypto.randomUUID();
      counterRef.current = createShareCounter(() => meydanApi(`${apiBase}/share`, {
        method: "POST", headers: { "idempotency-key": key },
      }));
    }
    void counterRef.current();
  }, [apiBase]);

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
      .catch(() => {
        if (active) { setContactsError(true); setContacts([]); }
      });
    if (isContent) setSaved(Boolean(post.bookmarked));
    else {
      void meydanApi<{ bookmarked?: boolean }>(`/narratives/${post.id}/bookmark`)
        .then((state) => active && setSaved(Boolean(state.bookmarked)))
        .catch(() => active && setSaved(null));
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated, post.id, isContent, post.bookmarked]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !studioOpen) requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose, studioOpen]);

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
    if (messenger.href) {
      const opened = window.open(messenger.href(url, shareText), "_blank");
      if (!opened) { flash("باز کردن پیام‌رسان ممکن نشد"); return; }
      opened.opener = null;
      countShare();
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareText, text: shareText, url });
        countShare();
        return;
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      flash(`پیوند کپی شد؛ در ${messenger.label} بچسبانید`);
      countShare();
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
      router.push(`/chat/${contactId}` as Route);
      requestClose();
    } catch {
      setSent((current) => ({ ...current, [contactId]: "failed" }));
    }
  };

  const toggleSaved = async () => {
    if (saveLock.current || !requireAuth(pagePath)) return;
    saveLock.current = true;
    setSavePending(true);
    const previous = saved;
    const next = !saved;
    try {
      await meydanApi(`${apiBase}/bookmark`, { method: next ? "PUT" : "DELETE" });
      setSaved(next);
      if (!isContent) announceBookmark({ id: post.id, bookmarked: next });
      flash(next ? (isContent ? "ذخیره شد" : "روایت ذخیره شد؛ در «نشان‌شده‌ها» می‌بینید") : "از ذخیره‌ها برداشته شد");
    } catch {
      setSaved(previous);
      flash("ذخیره روایت انجام نشد");
    } finally {
      saveLock.current = false;
      setSavePending(false);
    }
  };

  if (studioOpen) {
    return createPortal(<StoryStudio post={post} onClose={() => setStudioOpen(false)} onShared={countShare} />, document.body);
  }

  return createPortal(
    <div className={styles.shareOverlay} dir="rtl">
      <button type="button" tabIndex={-1} aria-label="بستن" onClick={requestClose} className={`${styles.shareBackdrop} ${closing ? styles.closing : ""}`} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="اشتراک‌گذاری روایت"
        className={`${styles.shareDialog} ${closing ? styles.closing : ""}`}
        style={closing ? undefined : { transform: dragY ? `translateY(${dragY}px)` : undefined, transition: isDragging ? "none" : "transform .25s cubic-bezier(.32,.72,0,1)" }}
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="touch-none"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
        >
          <span aria-hidden="true" className={styles.handle} />
          <div className={styles.shareHeader}>
            <div className="min-w-0">
              <p className={styles.shareTitle}>{post.title || post.body.slice(0, 60) || "روایت"}</p>
              <p className={styles.shareSubtitle}>{post.authorName}</p>
            </div>
            <button type="button" onClick={requestClose} aria-label="بستن" className={styles.shareClose}>
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isAuthenticated ? (
          <section className={styles.shareSection}>
            <h3 className={styles.sectionLabel}>ارسال سریع به مخاطبین</h3>
            {contacts === null ? (
              <LoaderCircle aria-label="در حال دریافت مخاطبین" className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : contactsError ? (
              <p role="status" className="text-[11px] text-muted-foreground">دریافت گفتگوها ممکن نشد. دوباره صفحه اشتراک را باز کنید.</p>
            ) : contacts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">هنوز گفتگویی ندارید.</p>
            ) : (
              <div className={styles.contacts}>
                {contacts.map((contact) => {
                  const state = sent[contact.id];
                  return (
                    <button key={contact.id} type="button" onClick={() => void sendTo(contact.id)} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                      <span className={styles.contactAvatar}>
                        {contact.avatarUrl ? <OptimizedAvatar src={contact.avatarUrl} alt="" width={56} className="h-full w-full object-cover" /> : contact.name.charAt(0)}
                        {state ? (
                          <span className="absolute inset-0 grid place-items-center bg-black/55 text-white">
                            {state === "sending" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : state === "sent" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.contactName}>{state === "sent" ? "ارسال شد" : state === "failed" ? "ناموفق" : contact.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        <section className={styles.shareSection}>
          <h3 className={styles.sectionLabel}>اشتراک در پیام‌رسان‌ها</h3>
          <div className={styles.messengers}>
            {MESSENGERS.map((messenger) => (
              <button key={messenger.id} type="button" onClick={() => void openMessenger(messenger)} className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand logos */}
                <img src={messenger.logo} alt="" aria-hidden="true" width={44} height={44} draggable={false} className={styles.messengerIcon} />
                <span className={styles.messengerLabel}>{messenger.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" onClick={() => void copyLink()} className={styles.action}>
            <Link2 aria-hidden="true" className="h-5 w-5 text-[#f0243a]" />
            کپی پیوند
          </button>
          <button type="button" onClick={() => setStudioOpen(true)} className={styles.action}>
            <FileText aria-hidden="true" className="h-5 w-5 text-[#f59e0b]" />
            عکس‌نوشت ساز
          </button>
          <button type="button" disabled={savePending} onClick={() => void toggleSaved()} aria-busy={savePending} aria-pressed={saved ?? undefined} className={styles.action}>
            {savePending ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : saved ? <BookmarkCheck aria-hidden="true" className="h-5 w-5" /> : <Bookmark aria-hidden="true" className="h-5 w-5" />}
            {savePending ? "در حال ذخیره" : saved ? "ذخیره شد" : "ذخیره روایت"}
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
