"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { worksPage, worksSummary } from "../services/works.service";
import { kindNames, type WorkGroup, type WorkSummary } from "../types";
import { fa, firstName, listTime } from "../utils";
import { Icon } from "./Icon";
import { WorkIcon } from "./WorkIcon";

type Filter = "all" | "joined" | "my_tasks" | "late" | "mentions";

function Row({ w, selected }: { w: WorkGroup; selected: boolean }) {
  const last = w.last_message;
  const p = w.progress ?? { done: 0, total: 0 };
  const preview = last
    ? `${last.sender_name ? firstName(last.sender_name) + ": " : ""}${last.kind !== "text" && last.kind !== "system" ? kindNames[last.kind] + " · " : ""}${last.title || last.body || ""}`
    : w.description || "هنوز پیامی ثبت نشده است";
  const unread = w.viewer.unread_count ?? 0;
  const at = w.viewer.mention_unread ?? 0;
  return (
    <Link className={`wg ${selected ? "on" : ""}`} href={`/works/${w.id}`} aria-current={selected ? "page" : undefined}>
      <WorkIcon work={w} />
      <span className="wg-main">
        <b>{w.title}</b>
        <span className="last">{preview}</span>
        <span className="wg-prog">
          <span className="tr">
            <span style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
          </span>
          {fa(p.done)}/{fa(p.total)}
          <span style={{ marginInlineStart: 2 }}>· {fa(w.member_count)} عضو</span>
        </span>
      </span>
      <span className="wg-side">
        <span>{listTime(last?.created_at ?? w.updated_at)}</span>
        <span className="badges">
          {at ? <span className="at">@</span> : null}
          {unread ? <span className="unread num">{fa(unread)}</span> : null}
        </span>
        {w.viewer.joined ? null : <span className="wg-guest">عضو نیستید</span>}
      </span>
    </Link>
  );
}

/** Left column of «کارها»: search, my-work tiles, filters and the list of works. */
export function WorksList({ selectedId, onFirst }: { selectedId?: string; onFirst: (id: string | undefined) => void }) {
  const [works, setWorks] = useState<WorkGroup[]>([]);
  const [summary, setSummary] = useState<WorkSummary>({ my_tasks: 0, late: 0, mentions: 0 });
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (quiet = false) => {
      const n = ++seq.current;
      try {
        const [page, sum] = await Promise.all([worksPage(filter, debounced), worksSummary()]);
        if (n !== seq.current) return;
        setWorks((cur) => {
          if (!quiet) return page.data;
          // Live refresh: update the first page in place, keep whatever older pages were already loaded.
          const ids = new Set(page.data.map((w) => w.id));
          return [...page.data, ...cur.filter((w) => !ids.has(w.id)).slice(0, Math.max(0, cur.length - page.data.length))];
        });
        if (!quiet) setCursor(page.nextCursor);
        setSummary(sum);
        setError("");
        if (filter === "all" && !debounced) onFirst(page.data[0]?.id);
      } catch (e) {
        if (n === seq.current) setError(e instanceof Error ? e.message : "دریافت کارها انجام نشد");
      } finally {
        if (n === seq.current) setLoading(false);
      }
    },
    [filter, debounced, onFirst],
  );

  useEffect(() => {
    // Deferred so the fetch (and its state updates) never run synchronously inside the effect.
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

  const tiles: { id: Filter; label: string; n: number; warn?: boolean }[] = [
    { id: "my_tasks", label: "وظیفه با من", n: summary.my_tasks },
    { id: "late", label: "دیرکرد", n: summary.late, warn: true },
    { id: "mentions", label: "اشاره به من", n: summary.mentions },
  ];

  return (
    <aside className="w-list">
      <div className="w-list-h">
        <div>
          <b>کارها</b>
          <small>هر کار یک اتاق با وظیفه، جلسه، اعلان و نظرسنجی</small>
        </div>
        <Link href="/compose?mode=work" className="btn primary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
          <Icon name="plus" size={14} weight={2.4} />
          کار جدید
        </Link>
      </div>
      <label className="sp-search w-search">
        <Icon name="search" size={16} weight={2} />
        <input type="search" placeholder="جستجوی کارها" aria-label="جستجوی کارها" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="w-me">
        {tiles.map((t) => (
          <button key={t.id} type="button" className={`${t.warn ? "warn" : ""} ${filter === t.id ? "on" : ""}`} aria-pressed={filter === t.id} onClick={() => setFilter(filter === t.id ? "all" : t.id)}>
            <b className="num">{fa(t.n)}</b>
            {t.label}
          </button>
        ))}
      </div>
      <div className="w-filt">
        {(
          [
            ["all", "همه"],
            ["joined", "عضو هستم"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={`chip ${filter === id ? "on" : ""}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="w-groups">
        {works.map((w) => (
          <Row key={w.id} w={w} selected={selectedId === w.id} />
        ))}
        {loading && !works.length ? (
          <div className="w-empty">
            <span className="spin" aria-label="در حال دریافت" />
          </div>
        ) : null}
        {!loading && !works.length && !error ? <p className="hint" style={{ padding: 16 }}>کاری با این مشخصات پیدا نشد.</p> : null}
        {error ? (
          <p className="hint err" role="alert" style={{ padding: 16 }}>
            {error}{" "}
            <button type="button" className="edit-pp" onClick={() => void load()}>
              تلاش دوباره
            </button>
          </p>
        ) : null}
        {cursor ? (
          <button
            type="button"
            className="btn load-more"
            disabled={more}
            onClick={async () => {
              setMore(true);
              try {
                const p = await worksPage(filter, debounced, cursor);
                setWorks((v) => [...v, ...p.data.filter((w) => !v.some((x) => x.id === w.id))]);
                setCursor(p.nextCursor);
              } catch (e) {
                setError(e instanceof Error ? e.message : "دریافت انجام نشد");
              } finally {
                setMore(false);
              }
            }}
          >
            کارهای بیشتر
          </button>
        ) : null}
      </div>
    </aside>
  );
}
