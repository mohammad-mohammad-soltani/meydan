"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { SharePost } from "./types";

// The sheet and the studio load only when a share is opened.
const ShareSheet = dynamic(() => import("./components/ShareSheet").then((m) => m.ShareSheet), { ssr: false });

type ShareContextValue = { openShare: (post: SharePost) => void };

const ShareContext = createContext<ShareContextValue | null>(null);

/** One share sheet for every surface that shows a post (feed, profile, post page, viewer). */
export function ShareProvider({ children }: { children: ReactNode }) {
  const [post, setPost] = useState<SharePost | null>(null);
  const openShare = useCallback((next: SharePost) => setPost(next), []);
  const value = useMemo(() => ({ openShare }), [openShare]);
  return (
    <ShareContext.Provider value={value}>
      {children}
      {post ? <ShareSheet key={post.id} post={post} onClose={() => setPost(null)} /> : null}
    </ShareContext.Provider>
  );
}

export function useShare(): ShareContextValue {
  const value = useContext(ShareContext);
  // Outside the app shell (e.g. a bare test render) fall back to the system sheet.
  return value ?? {
    openShare: (post) => {
      const url = `${window.location.origin}/posts/${post.id}`;
      if (typeof navigator.share === "function") void navigator.share({ title: post.title ?? post.authorName, url }).catch(() => undefined);
      else void navigator.clipboard?.writeText(url);
    },
  };
}
