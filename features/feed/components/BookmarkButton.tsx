"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { BOOKMARK_EVENT, announceBookmark, type BookmarkDetail } from "../bookmark-sync";

/**
 * Saves a post to «نشان‌شده‌ها». The saved state arrives with the post
 * (`viewer_state.bookmarked`), so the button costs no request until it is
 * pressed. The toggle is optimistic and rolled back if the write fails.
 */
export function BookmarkButton({ postId, bookmarked, className = "" }: { postId: string; bookmarked: boolean; className?: string }) {
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(bookmarked);
  const [busy, setBusy] = useState(false);

  // A newer server value (e.g. a refetched list) wins over the local one.
  const [seen, setSeen] = useState(bookmarked);
  if (seen !== bookmarked) {
    setSeen(bookmarked);
    setSaved(bookmarked);
  }

  // The share sheet can save the same post; stay in step with it.
  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<BookmarkDetail>).detail;
      if (detail.id === postId) setSaved(detail.bookmarked);
    };
    window.addEventListener(BOOKMARK_EVENT, onChange);
    return () => window.removeEventListener(BOOKMARK_EVENT, onChange);
  }, [postId]);

  const toggle = async () => {
    if (busy || !requireAuth(`/posts/${postId}`)) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      await meydanApi(`/narratives/${postId}/bookmark`, { method: next ? "PUT" : "DELETE" });
      announceBookmark({ id: postId, bookmarked: next });
    } catch (reason) {
      setSaved(!next);
      void isAuthApiError(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        // The timeline card is wrapped in a link.
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      aria-label={saved ? "برداشتن از نشان‌شده‌ها" : "نشان کردن روایت"}
      aria-pressed={saved}
      className={`pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors active:scale-90 ${saved ? "text-foreground" : "hover:text-foreground"} ${className}`}
    >
      <Bookmark aria-hidden="true" className={`h-[17px] w-[17px] transition-transform duration-200 ${saved ? "scale-110 fill-current" : ""}`} />
    </button>
  );
}
