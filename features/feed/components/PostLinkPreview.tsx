"use client";

import { useEffect, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";
import { mapQuotedNarrative, type ApiQuotedNarrative } from "../services/quote-mapper";
import type { QuotedPost } from "../types";
import { QuotedPostCard } from "./QuotedPostCard";

type State = { status: "loading" } | { status: "ready"; post: QuotedPost };

/** A bare link to one of our own posts, unfurled into the same card a quote-repost uses. */
export function PostLinkPreview({ postId, className = "" }: { postId: string; className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    void meydanApi<ApiQuotedNarrative>(`/narratives/${postId}`)
      .then((item) => {
        if (!active) return;
        const post = mapQuotedNarrative(item) ?? { id: postId, unavailable: true as const };
        setState({ status: "ready", post });
      })
      .catch(() => {
        if (active) setState({ status: "ready", post: { id: postId, unavailable: true } });
      });
    return () => {
      active = false;
    };
  }, [postId]);

  if (state.status === "loading") {
    return <div aria-hidden="true" className={`mt-2 h-[72px] animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`} />;
  }
  return <QuotedPostCard quote={state.post} className={className} />;
}
