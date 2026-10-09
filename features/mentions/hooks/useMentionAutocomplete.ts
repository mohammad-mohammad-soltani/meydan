"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type KeyboardEvent, type RefObject } from "react";
import { getCaretCoordinates } from "@/features/compose/caret";
import { activeMentionToken, normalizeMentionQuery, type MentionToken } from "../mentions";
import { getMentionSuggestions, type MentionSuggestion } from "../mentions.service";

type Options = {
  areaRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  setText: (value: string) => void;
  maxLength: number;
};

/**
 * `@` autocomplete for a textarea: tracks the token under the caret, fetches
 * suggestions (debounced, aborting stale requests), drives the keyboard and
 * writes `@handle ` back in place of the typed fragment.
 */
export function useMentionAutocomplete({ areaRef, text, setText, maxLength }: Options) {
  const [token, setToken] = useState<MentionToken | null>(null);
  const [items, setItems] = useState<MentionSuggestion[]>([]);
  const [settledFor, setSettledFor] = useState<string | null>(null);
  // The highlighted row belongs to one query; a new query starts again at the top.
  const [highlight, setHighlight] = useState<{ query: string | undefined; index: number }>({ query: undefined, index: 0 });
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const query = token?.query;

  useEffect(() => {
    if (query === undefined) return;
    const controller = new AbortController();
    // A bare `@` asks for the viewer's own follows at once; typing waits a beat.
    const timer = window.setTimeout(() => {
      void getMentionSuggestions(query, controller.signal)
        .then((next) => {
          setItems(next);
          setSettledFor(query);
        })
        .catch((reason: unknown) => {
          if ((reason as { name?: string } | null)?.name === "AbortError") return;
          setItems([]);
          setSettledFor(query);
        });
    }, query === "" ? 0 : 140);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Narrow the last answer to what is typed right away, so the list tracks every keystroke.
  const visible = useMemo(() => {
    if (query === undefined) return [];
    const prefix = normalizeMentionQuery(query);
    return items.filter((item) => item.handle.startsWith(prefix));
  }, [items, query]);

  const loading = query !== undefined && settledFor !== query;
  const open = token !== null && (visible.length > 0 || loading || (query !== "" && settledFor === query));

  const active = highlight.query === query ? highlight.index : 0;
  const setActive = (next: number | ((index: number) => number)) =>
    setHighlight({ query, index: typeof next === "function" ? next(active) : next });

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!token || !area || !open) {
      setPosition(null);
      return;
    }
    const caret = getCaretCoordinates(area, token.start + token.query.length + 1);
    const maxLeft = Math.max(0, area.offsetWidth - 280);
    setPosition({
      top: area.offsetTop + caret.top + caret.height + 6,
      left: Math.min(Math.max(0, area.offsetLeft + caret.left - 8), maxLeft),
    });
  }, [areaRef, token, open, text, visible.length]);

  /** Keeps the same object when nothing changed, so a bare arrow-key keyup doesn't restart the fetch. */
  const update = (value: string, caret: number) => {
    const next = activeMentionToken(value, caret);
    setToken((prev) => (prev && next && prev.start === next.start && prev.query === next.query ? prev : next));
  };

  const sync = () => {
    const area = areaRef.current;
    if (area) update(area.value, area.selectionStart ?? area.value.length);
  };

  const close = () => setToken(null);

  const pick = (item: MentionSuggestion) => {
    const area = areaRef.current;
    if (!token || !area) return;
    const end = area.selectionStart ?? token.start + token.query.length + 1;
    const insertion = `@${item.handle} `;
    setText((text.slice(0, token.start) + insertion + text.slice(end)).slice(0, maxLength));
    setToken(null);
    const caret = token.start + insertion.length;
    window.requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  };

  /** Returns true when the key belonged to the popover, so the caller skips its own handling. */
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (!token || event.nativeEvent.isComposing) return false;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return true;
    }
    const count = visible.length;
    if (!count) return false;
    if (event.key === "ArrowDown") setActive((i) => (i + 1) % count);
    else if (event.key === "ArrowUp") setActive((i) => (i - 1 + count) % count);
    else if (event.key === "Tab" || event.key === "Enter") pick(visible[active] ?? visible[0]);
    else return false;
    event.preventDefault();
    return true;
  };

  return { open, token, items: visible, loading, query: query ?? "", active, setActive, position, update, sync, close, pick, onKeyDown };
}
