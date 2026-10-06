"use client";

import "../reference-notes.css";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { meydanApi } from "@/lib/meydan-api";
import { toItem, type ApiContent } from "../services/content.service";
import type { ContentItem } from "../types";
import { NoteQuote, noteBackground } from "./note-ui";

type State = { status: "loading" } | { status: "ready"; item: ContentItem | null };

/** A link to one of our content pages, unfurled into a compact card (cover, category, title, author). */
export function ContentLinkPreview({ contentId, className = "" }: { contentId: string; className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void meydanApi<ApiContent>(`/content/${contentId}`)
      .then((row) => active && setState({ status: "ready", item: toItem(row) }))
      .catch(() => active && setState({ status: "ready", item: null }));
    return () => {
      active = false;
    };
  }, [contentId]);

  if (state.status === "loading") return <div aria-hidden="true" className={`mt-2 h-[84px] animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`} />;
  const item = state.item;
  if (!item) return <div className={`cl-card ${className}`}><span className="cl-body"><small>این محتوا در دسترس نیست.</small></span></div>;

  return (
    <Link href={`/content/${item.apiId}` as Route} className={`cl-card ${className}`} onClick={(event) => event.stopPropagation()}>
      <span className={`cl-th ${item.coverUrl ? "" : "ph"}`} style={noteBackground(item.coverUrl, item.apiId % 8)} aria-hidden="true">
        {item.coverUrl ? null : <NoteQuote />}
      </span>
      <span className="cl-body">
        {item.categoryName ? <em className="cl-cat">{item.categoryName}</em> : null}
        <b>{item.title}</b>
        <small>
          {item.author}
          <AccountBadges verified={item.authorVerified} speaker={item.authorSpeaker} official={item.authorOfficial} kind={item.authorKind} size="sm" />
          {item.readingMinutes ? ` · ${item.readingMinutes.toLocaleString("fa-IR")} دقیقه` : ""}
        </small>
      </span>
    </Link>
  );
}
