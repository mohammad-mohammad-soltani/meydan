"use client";

import Link from "next/link";
import type { Route } from "next";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { useFollowSet } from "@/features/explore/hooks/useFollowSet";
import { meydanApi } from "@/lib/meydan-api";
import { actorKindOf, publicProfileHref, type ActorKind } from "@/lib/profile-route";
import { hueOf } from "@/lib/relative-fa";

type ApiActor = { id: string; type?: string; handle?: string; display_name?: string; avatar_url?: string | null; verified?: boolean; verified_speaker?: boolean; verified_official?: boolean; headline?: string };
type Row = { key: string; type: ActorKind; id: number; name: string; handle?: string; href: string; avatarUrl?: string; verified: boolean; speaker: boolean; official: boolean; headline: string };
type Tab = "followers" | "following";

const subscribeNothing = () => () => {};
const normalize = (value: string) => value.toLowerCase().replaceAll("ي", "ی").replaceAll("ك", "ک");

function toRow(actor: ApiActor): Row | null {
  const id = Number(String(actor.id).match(/(\d+)$/)?.[1] ?? 0);
  if (!id) return null;
  const type = actorKindOf(actor.type);
  return {
    key: `${type}:${id}`,
    type,
    id,
    name: actor.display_name || "کاربر میدان",
    handle: actor.handle,
    href: publicProfileHref(type, id, actor.handle),
    avatarUrl: actor.avatar_url || undefined,
    verified: Boolean(actor.verified),
    speaker: Boolean(actor.verified_speaker),
    official: Boolean(actor.verified_official),
    headline: actor.headline ?? "",
  };
}

/**
 * «دنبال‌کننده‌ها / دنبال‌شده‌ها» of one profile: a full-screen list with search
 * and follow buttons. A tab is read when it is first opened, not before.
 */
export function FollowListSheet({ type, id, name, handle, initialTab = "followers", onClose }: { type: ActorKind; id: number; name: string; handle?: string; initialTab?: Tab; onClose: () => void }) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [lists, setLists] = useState<Partial<Record<Tab, Row[] | "error">>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (lists[tab]) return;
    let live = true;
    void meydanApi<ApiActor[]>(`/actors/${type}/${id}/${tab}`)
      .then((rows) => { if (live) setLists((current) => ({ ...current, [tab]: rows.map(toRow).filter((row): row is Row => row !== null) })); })
      .catch(() => { if (live) setLists((current) => ({ ...current, [tab]: "error" })); });
    return () => { live = false; };
  }, [tab, type, id, lists]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const current = lists[tab];
  const rows = useMemo(() => (Array.isArray(current) ? current : []), [current]);
  const follow = useFollowSet(rows);
  const needle = normalize(query.trim());
  const visible = needle ? rows.filter((row) => normalize(`${row.name} ${row.handle ?? ""} ${row.headline}`).includes(needle)) : rows;

  if (!mounted) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="فهرست دنبال‌کننده‌ها" dir="rtl" className="fixed inset-0 z-[220] flex flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-divider px-4 py-3">
        <button type="button" onClick={onClose} aria-label="بازگشت" className="grid h-10 w-10 place-items-center rounded-full bg-surface-muted hover:bg-hover"><X aria-hidden="true" className="h-5 w-5" /></button>
        <div className="min-w-0"><b className="block truncate text-sm font-black">{name}</b>{handle ? <small className="latin-digits block text-[11px] text-muted-foreground" dir="ltr">@{handle}</small> : null}</div>
      </header>
      <nav className="grid grid-cols-2 border-b border-divider" aria-label="فهرست">
        {([["followers", "دنبال‌کننده‌ها"], ["following", "دنبال‌شده‌ها"]] as const).map(([value, label]) => (
          <button key={value} type="button" aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)} className={`relative py-3.5 text-sm font-black ${tab === value ? "text-foreground" : "text-muted-foreground"}`}>
            {label}
            <span aria-hidden="true" className={`absolute inset-x-[28%] bottom-0 h-[3px] rounded-full bg-brand transition-opacity ${tab === value ? "opacity-100" : "opacity-0"}`} />
          </button>
        ))}
      </nav>
      <label className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl border border-border bg-surface-muted px-4 py-2.5">
        <Search aria-hidden="true" className="h-[17px] w-[17px] shrink-0 text-icon-muted" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در فهرست" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-placeholder" />
      </label>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-8">
        {current === undefined ? (
          <LoaderCircle aria-label="در حال دریافت" className="mx-auto mt-12 h-5 w-5 animate-spin text-muted-foreground" />
        ) : current === "error" ? (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">دریافت فهرست ممکن نشد.</p>
        ) : visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">{needle ? "نتیجه‌ای پیدا نشد." : tab === "followers" ? "هنوز دنبال‌کننده‌ای ندارد." : "هنوز کسی را دنبال نکرده است."}</p>
        ) : (
          <ul className="divide-y divide-divider">
            {visible.map((row) => {
              const on = follow.isFollowing(row.type, row.id);
              return (
                <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                  <Link href={row.href as Route} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white" style={{ background: `hsl(${hueOf(row.name)} 45% 36%)` }}>
                      {row.avatarUrl ? <OptimizedAvatar src={row.avatarUrl} alt="" width={48} className="h-full w-full object-cover" /> : row.name.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <b className="flex items-center gap-1 text-sm font-black"><span className="truncate">{row.name}</span><AccountBadges verified={row.verified} speaker={row.speaker} official={row.official} kind={row.type} size="sm" /></b>
                      {row.handle ? <small className="latin-digits block truncate text-[11px] text-muted-foreground" dir="ltr">@{row.handle}</small> : null}
                      {row.headline ? <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground-secondary">{row.headline}</p> : null}
                    </span>
                  </Link>
                  <button type="button" aria-pressed={on} onClick={() => follow.toggle(row.type, row.id)} className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold ${on ? "border-border bg-surface-muted text-muted-foreground" : "border-transparent bg-foreground text-background"}`}>
                    {on ? "دنبال می‌کنید" : "دنبال کردن"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
