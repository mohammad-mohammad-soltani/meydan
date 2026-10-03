"use client";

import Link from "next/link";
import type { Route } from "next";
import { FileText, Quote, Trash2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { PageShell } from "./PageShell";

const BASE_KEY = "meydan-compose-draft";

type Draft = { key: string; title: string; text: string; quoteId: string | null };

function readDrafts(): Draft[] {
  const out: Draft[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || (key !== BASE_KEY && !key.startsWith(`${BASE_KEY}:quote:`))) continue;
      const value = JSON.parse(window.localStorage.getItem(key) ?? "null") as { title?: string; text?: string } | null;
      if (!value) continue;
      out.push({ key, title: String(value.title ?? ""), text: String(value.text ?? ""), quoteId: key.startsWith(`${BASE_KEY}:quote:`) ? key.split(":").pop() ?? null : null });
    }
  } catch {
    // Storage can be unavailable (private windows); the list is then simply empty.
  }
  return out;
}

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

/**
 * «پیش‌نویس‌ها»: what the composer saved on this device. The composer keeps one
 * draft for a plain narrative and one per quoted post.
 */
export function DraftsView() {
  const [version, setVersion] = useState(0);
  // The snapshot is a string so React can compare it by value between renders.
  const snapshot = useSyncExternalStore(subscribe, () => `${version}:${JSON.stringify(readDrafts())}`, () => "0:[]");
  const drafts = JSON.parse(snapshot.slice(snapshot.indexOf(":") + 1)) as Draft[];

  return (
    <PageShell title="پیش‌نویس‌ها" subtitle="متن‌هایی که در این دستگاه نیمه‌کاره مانده‌اند" back="/home">
      {drafts.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-icon-muted"><FileText aria-hidden="true" className="h-7 w-7" /></span>
          <p className="mt-4 text-sm font-black">پیش‌نویسی ندارید</p>
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-6 text-muted-foreground">هر روایتی را که نیمه‌کاره رها کنید، همین‌جا نگه داشته می‌شود.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-divider border-y border-divider">
          {drafts.map((draft) => (
            <li key={draft.key} className="flex items-start gap-3 px-4 py-4">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-muted text-icon">{draft.quoteId ? <Quote aria-hidden="true" className="h-[18px] w-[18px]" /> : <FileText aria-hidden="true" className="h-[18px] w-[18px]" />}</span>
              <Link href={(draft.quoteId ? `/compose?quote=${draft.quoteId}` : "/compose") as Route} className="min-w-0 flex-1">
                <b className="block truncate text-sm font-black">{draft.title || (draft.quoteId ? "نقل‌قول نیمه‌کاره" : "روایت نیمه‌کاره")}</b>
                <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{draft.text || "بدون متن"}</p>
                <span className="mt-1.5 inline-block text-[11px] font-bold text-brand">ادامه نوشتن</span>
              </Link>
              <button
                type="button"
                aria-label="حذف پیش‌نویس"
                onClick={() => {
                  try { window.localStorage.removeItem(draft.key); } catch { /* ignore */ }
                  setVersion((value) => value + 1);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-danger-surface hover:text-danger"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
