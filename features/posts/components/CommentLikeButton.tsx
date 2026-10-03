"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";

const fa = new Intl.NumberFormat("fa-IR");

/** Heart with a count under a comment; optimistic, rolled back if the write fails. */
export function CommentLikeButton({ commentId, postId, likes, liked }: { commentId: string; postId: string; likes: number; liked: boolean }) {
  const { requireAuth } = useAuthGate();
  const [state, setState] = useState({ liked, likes });
  const [busy, setBusy] = useState(false);
  if (!/^\d+$/.test(commentId)) return null;

  const toggle = async () => {
    if (busy || !requireAuth(`/posts/${postId}`)) return;
    const before = state;
    const next = { liked: !before.liked, likes: Math.max(0, before.likes + (before.liked ? -1 : 1)) };
    setState(next);
    setBusy(true);
    try {
      const result = await meydanApi<{ liked: boolean; likes: number }>(`/comments/${commentId}/like`, { method: next.liked ? "PUT" : "DELETE" });
      setState({ liked: result.liked, likes: result.likes });
    } catch {
      setState(before);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={state.liked ? "برداشتن پسند" : "پسندیدن"}
      onClick={() => void toggle()}
      className={`flex shrink-0 flex-col items-center gap-0.5 self-start pt-1 text-[10px] transition-colors ${state.liked ? "text-pink-500" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Heart aria-hidden="true" className={`h-[18px] w-[18px] ${state.liked ? "fill-current" : ""}`} />
      {state.likes > 0 ? fa.format(state.likes) : null}
    </button>
  );
}
