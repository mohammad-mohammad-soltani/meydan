"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeakerPage, type SpeakerPage } from "../services/speakers.service";
import type { SpeakerCategory, SpeakerFilter } from "../types";

export function useSpeakers(initial: SpeakerPage, categories: SpeakerCategory[] = []) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SpeakerFilter>("all");
  const [result, setResult] = useState(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0);
  const busy = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const token = ++generation.current;
    setIsLoading(true);
    setError("");
    const timer = setTimeout(() => {
      void getSpeakerPage(1, query, filter).then((page) => {
        if (token === generation.current) setResult(page);
      }).catch(() => {
        if (token === generation.current) setError("دریافت سخنرانان ممکن نشد.");
      }).finally(() => {
        if (token === generation.current) setIsLoading(false);
      });
    }, 250);
    return () => { clearTimeout(timer); if (generation.current === token) generation.current = token + 1; };
  }, [query, filter, retryKey]);

  const loadMore = useCallback(async () => {
    if (busy.current || isLoading || result.page >= result.pages) return;
    busy.current = true;
    setIsLoadingMore(true);
    setError("");
    const token = generation.current;
    try {
      // Fetch a three-page window (150 speakers) per scroll step. The first
      // request is page 1, so the first scroll advances through pages 2 and 3.
      const nextPages = [result.page + 1, result.page + 2].filter((page) => page <= result.pages);
      const pages = await Promise.all(nextPages.map((page) => getSpeakerPage(page, query, filter)));
      if (token !== generation.current) return;
      setResult((current) => {
        const ids = new Set(current.items.map((speaker) => speaker.id));
        const incoming = pages.flatMap((page) => page.items).filter((speaker) => !ids.has(speaker.id));
        const last = pages[pages.length - 1];
        return last ? { ...last, items: [...current.items, ...incoming] } : current;
      });
    } catch {
      if (token === generation.current) setError("دریافت سخنرانان بعدی ممکن نشد.");
    } finally {
      busy.current = false;
      if (token === generation.current) setIsLoadingMore(false);
    }
  }, [filter, isLoading, query, result.page, result.pages]);

  const retry = () => setRetryKey((current) => current + 1);
  return { query, filter, categories, speakers: result.items, total: result.total, hasMore: result.page < result.pages, isLoading, isLoadingMore, error, loadMore, retry, setQuery, setFilter };
}
