"use client";

import Link from "next/link";
import type { Route } from "next";
import { Heart, LoaderCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { hueOf, relativeFa } from "@/lib/relative-fa";
import { listComments, listReplies, postComment, setCommentLike, type ReelComment } from "../comments.service";

const EMOJIS = ["❤️", "🙌", "🔥", "👏", "😍", "😮", "😂"];
const fa = new Intl.NumberFormat("fa-IR");
const subscribeNothing = () => () => {};
const without = <T,>(record: Record<number, T>, id: number) => Object.fromEntries(Object.entries(record).filter(([key]) => Number(key) !== id)) as Record<number, T>;

function Avatar({ comment }: { comment: ReelComment }) {
  return (
    <Link href={comment.profileHref as Route} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-black text-neutral-900" style={{ background: `hsl(${hueOf(comment.name)} 80% 82%)` }}>
      {comment.avatarUrl ? <OptimizedAvatar src={comment.avatarUrl} alt="" width={36} className="h-full w-full object-cover" /> : comment.name.charAt(0)}
    </Link>
  );
}

function CommentRow({
  comment,
  nested = false,
  onLike,
  onReply,
  children,
}: {
  comment: ReelComment;
  nested?: boolean;
  onLike: (comment: ReelComment) => void;
  onReply: (comment: ReelComment) => void;
  children?: React.ReactNode;
}) {
  return (
    <li className={nested ? "ps-0" : ""}>
      <div className="flex gap-2.5">
        <Avatar comment={comment} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 text-[11px]">
            <b className="truncate font-black text-white">{comment.name}</b>
            <span className="shrink-0 text-white/50">{comment.mine ? "همین الان · شما" : relativeFa(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-6 text-white/90">{comment.body}</p>
          <button type="button" onClick={() => onReply(comment)} className="mt-0.5 text-[11px] font-bold text-white/55 hover:text-white">پاسخ</button>
        </div>
        <button
          type="button"
          aria-pressed={comment.liked}
          aria-label={comment.liked ? "برداشتن پسند" : "پسندیدن"}
          onClick={() => onLike(comment)}
          className={`flex shrink-0 flex-col items-center gap-0.5 self-start pt-1 text-[10px] ${comment.liked ? "text-pink-500" : "text-white/55"}`}
        >
          <Heart aria-hidden="true" className={`h-[18px] w-[18px] ${comment.liked ? "fill-current" : ""}`} />
          {comment.likes > 0 ? fa.format(comment.likes) : null}
        </button>
      </div>
      {children}
    </li>
  );
}

/**
 * The comments of one video post: a bottom sheet on phones, a floating panel
 * beside the video on desktop. It lives in a portal above the viewer so the
 * viewer's swipe gestures never see its touches.
 */
export function ReelComments({ postId, count, onClose, onPosted, intro, panel = false }: { postId: string; count: number; onClose: () => void; onPosted: (delta: number) => void; /** Author and caption shown above the list (the desktop side panel). */ intro?: React.ReactNode; /** Side panel beside the player: no dimmed backdrop, no close button, never traps focus. */ panel?: boolean }) {
  const { requireAuth } = useAuthGate();
  const [items, setItems] = useState<ReelComment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<number, ReelComment[] | "loading">>({});
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<ReelComment | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);

  useEffect(() => {
    let live = true;
    void listComments(postId)
      .then((page) => { if (live) { setItems(page.items); setCursor(page.nextCursor); } })
      .catch(() => { if (live) { setItems([]); setError("نظرها دریافت نشد."); } });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { live = false; window.removeEventListener("keydown", onKey); };
  }, [postId, onClose]);

  const patch = useCallback((id: number, change: Partial<ReelComment>) => {
    const apply = (list: ReelComment[]) => list.map((entry) => (entry.id === id ? { ...entry, ...change } : entry));
    setItems((current) => (current ? apply(current) : current));
    setReplies((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, Array.isArray(value) ? apply(value) : value])));
  }, []);

  const like = async (comment: ReelComment) => {
    if (!requireAuth(`/posts/${postId}`)) return;
    const next = !comment.liked;
    patch(comment.id, { liked: next, likes: Math.max(0, comment.likes + (next ? 1 : -1)) });
    try {
      const result = await setCommentLike(comment.id, next);
      patch(comment.id, { liked: result.liked, likes: result.likes });
    } catch {
      patch(comment.id, { liked: comment.liked, likes: comment.likes });
    }
  };

  const toggleReplies = async (comment: ReelComment) => {
    if (replies[comment.id]) {
      setReplies((current) => without(current, comment.id));
      return;
    }
    setReplies((current) => ({ ...current, [comment.id]: "loading" }));
    try {
      const list = await listReplies(comment.id);
      setReplies((current) => ({ ...current, [comment.id]: list }));
    } catch {
      setReplies((current) => without(current, comment.id));
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !requireAuth(`/posts/${postId}`)) return;
    setSending(true);
    setError("");
    try {
      const created = await postComment(postId, body, target?.id);
      if (target) {
        setReplies((current) => ({ ...current, [target.id]: [...(Array.isArray(current[target.id]) ? (current[target.id] as ReelComment[]) : []), created] }));
        patch(target.id, { replyCount: target.replyCount + 1 });
      } else {
        setItems((current) => [created, ...(current ?? [])]);
      }
      setDraft("");
      setTarget(null);
      onPosted(1);
    } catch {
      setError("نظر ارسال نشد؛ متن حفظ شده است.");
    } finally {
      setSending(false);
    }
  };

  const more = async () => {
    if (!cursor) return;
    const page = await listComments(postId, cursor).catch(() => null);
    if (!page) return;
    setItems((current) => [...(current ?? []), ...page.items]);
    setCursor(page.nextCursor);
  };

  if (!mounted) return null;

  const dialog = (
      <section
      role="dialog"
      aria-modal={panel ? undefined : "true"}
      aria-label="نظرات"
      dir="rtl"
      className={panel ? "relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#1b1b1b] text-white" : "relative flex h-[72dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#1b1b1b] text-white shadow-2xl lg:pointer-events-auto lg:h-full lg:w-[380px] lg:max-w-none lg:rounded-3xl"}
    >
      {intro}
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3.5">
        <h2 className="text-sm font-black">نظرات</h2>
        <span className="text-xs text-white/50">{fa.format(count)}</span>
        {panel ? null : <button type="button" onClick={onClose} aria-label="بستن" className="ms-auto grid h-8 w-8 place-items-center rounded-full bg-white/10"><X aria-hidden="true" className="h-4 w-4" /></button>}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {items === null ? (
          <LoaderCircle aria-label="در حال دریافت" className="mx-auto mt-10 h-5 w-5 animate-spin text-white/50" />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/55">{error || "هنوز نظری ثبت نشده؛ اولین نفر باشید."}</p>
        ) : (
          <ul className="space-y-5">
            {items.map((comment) => (
              <CommentRow key={comment.id} comment={comment} onLike={like} onReply={(entry) => { setTarget(entry); inputRef.current?.focus(); }}>
                {comment.replyCount > 0 || Array.isArray(replies[comment.id]) ? (
                  <div className="ms-11 mt-2">
                    <button type="button" onClick={() => void toggleReplies(comment)} className="text-[11px] font-bold text-white/55 hover:text-white">
                      {replies[comment.id] ? "پنهان کردن پاسخ‌ها" : `مشاهده ${fa.format(comment.replyCount)} پاسخ`}
                    </button>
                    {replies[comment.id] === "loading" ? <LoaderCircle aria-label="در حال دریافت" className="mt-2 h-4 w-4 animate-spin text-white/50" /> : null}
                    {Array.isArray(replies[comment.id]) ? (
                      <ul className="mt-3 space-y-4">
                        {(replies[comment.id] as ReelComment[]).map((reply) => (
                          <CommentRow key={reply.id} comment={reply} nested onLike={like} onReply={(entry) => { setTarget(entry.parentId ? comment : entry); inputRef.current?.focus(); }} />
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </CommentRow>
            ))}
          </ul>
        )}
        {cursor ? <button type="button" onClick={() => void more()} className="mx-auto mt-4 block text-xs font-bold text-white/60 hover:text-white">نظرهای بیشتر</button> : null}
      </div>

      <footer className="border-t border-white/10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="no-scrollbar mb-2 flex justify-between gap-1 overflow-x-auto" aria-label="واکنش سریع">
          {EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => { setDraft((current) => current + emoji); inputRef.current?.focus(); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl transition-transform active:scale-125">{emoji}</button>
          ))}
        </div>
        {target ? (
          <p className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-white/60">
            پاسخ به {target.name}
            <button type="button" onClick={() => setTarget(null)} className="font-bold text-white">لغو</button>
          </p>
        ) : null}
        {error && items?.length ? <p role="alert" className="mb-1.5 px-1 text-[11px] text-red-400">{error}</p> : null}
        <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="نظر خود را بنویسید…"
            maxLength={1000}
            className="min-h-11 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
          />
          <button type="submit" disabled={!draft.trim() || sending} aria-label="ارسال" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground disabled:opacity-40">
            {sending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4 -scale-x-100" />}
          </button>
        </form>
      </footer>
    </section>
  );

  if (panel) return dialog;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center lg:items-stretch lg:justify-start lg:p-6 lg:pointer-events-none" role="presentation">
      <button type="button" tabIndex={-1} aria-label="بستن نظرها" onClick={onClose} className="absolute inset-0 bg-black/55 lg:bg-transparent lg:pointer-events-none" />
      {dialog}
    </div>,
    document.body,
  );
}
