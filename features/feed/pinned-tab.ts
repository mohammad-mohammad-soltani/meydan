import type { FeedFilter } from "./types";

const KEY = "nm_pin";

/** The categories that can be pinned as the third tab; «پویش» has no feed behind it yet. */
export const PIN_OPTIONS: Array<{ id: FeedFilter | "campaign"; label: string; soon?: boolean }> = [
  { id: "initiatives", label: "کار" },
  { id: "campaign", label: "پویش", soon: true },
  { id: "reflected", label: "پوشش رسانه‌ای" },
  { id: "narratives", label: "روایت" },
];

const listeners = new Set<() => void>();

export function readPinned(): FeedFilter | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return PIN_OPTIONS.some((option) => option.id === value && !option.soon) ? (value as FeedFilter) : null;
  } catch {
    return null;
  }
}

export function writePinned(value: FeedFilter | null): void {
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Without storage the pin simply lasts until the page is closed.
  }
  for (const listener of listeners) listener();
}

export function subscribePinned(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export const pinnedLabel = (id: FeedFilter | null): string => PIN_OPTIONS.find((option) => option.id === id)?.label ?? "";
