"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { worksPage } from "../services/works.service";
import type { WorkGroup } from "../types";

/** Paged list of the work groups the viewer has joined, for the unified conversations sidebar (filter and search are server-side). */
export function useWorksFeed(query: string) {
  const [works, setWorks] = useState<WorkGroup[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [debounced, setDebounced] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (quiet = false) => {
      const n = ++seq.current;
      try {
        const page = await worksPage("joined", debounced);
        if (n !== seq.current) return;
        setWorks((cur) => {
          if (!quiet) return page.data;
          // Live refresh: replace the first page in place, keep older pages already loaded.
          const ids = new Set(page.data.map((w) => w.id));
          return [...page.data, ...cur.filter((w) => !ids.has(w.id)).slice(0, Math.max(0, cur.length - page.data.length))];
        });
        if (!quiet) setCursor(page.nextCursor);
        setError("");
      } catch (e) {
        if (n === seq.current) setError(e instanceof Error ? e.message : "دریافت کارها انجام نشد");
      } finally {
        if (n === seq.current) setLoading(false);
      }
    },
    [debounced],
  );

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    let disposed = false;
    let off: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(true), 1200);
    };
    subscribeToUserChannel(
      { "work:updated": refresh, "work:message:created": refresh, "work:message:updated": refresh, "work:read": refresh },
      { onSubscribed: refresh },
    )
      .then((fn) => (disposed ? fn() : (off = fn)))
      .catch(() => undefined);
    const local = () => void load(true);
    window.addEventListener("works:changed", local);
    return () => {
      disposed = true;
      off?.();
      clearTimeout(timer);
      window.removeEventListener("works:changed", local);
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const p = await worksPage("joined", debounced, cursor);
      setWorks((v) => [...v, ...p.data.filter((w) => !v.some((x) => x.id === w.id))]);
      setCursor(p.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "دریافت انجام نشد");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, debounced, loadingMore]);

  return { works, loading, error, hasMore: Boolean(cursor), loadingMore, loadMore, reload: () => load() };
}
