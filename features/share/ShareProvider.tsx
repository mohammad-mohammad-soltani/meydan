"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { SharePost } from "./types";

// The sheet and the studio load only when a share is opened.
const ShareSheet = dynamic(() => import("./components/ShareSheet").then((m) => m.ShareSheet), { ssr: false });
const StoryStudio = dynamic(() => import("./components/StoryStudio").then((m) => m.StoryStudio), { ssr: false });

type ShareContextValue = { openShare: (post: SharePost) => void; openStory: (post: SharePost) => void };

const ShareContext = createContext<ShareContextValue | null>(null);

/** One share sheet (and one photo-quote studio) for every surface that shows a post (feed, profile, post page, viewer). */
export function ShareProvider({ children }: { children: ReactNode }) {
  const [post, setPost] = useState<SharePost | null>(null);
  const [storyPost, setStoryPost] = useState<SharePost | null>(null);
  const openShare = useCallback((next: SharePost) => setPost(next), []);
  const openStory = useCallback((next: SharePost) => setStoryPost(next), []);
  const value = useMemo(() => ({ openShare, openStory }), [openShare, openStory]);
  return (
    <ShareContext.Provider value={value}>
      {children}
      {post ? <ShareSheet key={post.id} post={post} onClose={() => setPost(null)} /> : null}
      {storyPost ? <StoryStudio key={storyPost.id} post={storyPost} onClose={() => setStoryPost(null)} onShared={() => undefined} /> : null}
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
    openStory: (post) => {
      const url = `${window.location.origin}/posts/${post.id}`;
      if (typeof navigator.share === "function") void navigator.share({ title: post.title ?? post.authorName, url }).catch(() => undefined);
      else void navigator.clipboard?.writeText(url);
    },
  };
}
