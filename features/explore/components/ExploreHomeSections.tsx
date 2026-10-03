"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, Eye, Flame, Hash, Mic, MapPin, Sparkles, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { BookmarkButton } from "@/features/feed/components/BookmarkButton";
import { hueOf } from "@/lib/relative-fa";
import type { ExploreAccount, ExploreHome, ExploreHotNarrative } from "../services/explore-home.service";

const fa = new Intl.NumberFormat("fa-IR");
const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

type FollowApi = { isFollowing: (type: ExploreAccount["type"], id: number) => boolean; toggle: (type: ExploreAccount["type"], id: number) => void };
export type ExploreSection = "tags" | "suggestions" | "hot" | "active" | "people" | "speakers";

function Head({ icon: Icon, title, hint }: { icon: typeof Hash; title: string; hint?: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-3 px-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-muted text-brand"><Icon aria-hidden="true" className="h-[18px] w-[18px]" /></span>
      <div className="min-w-0"><h2 className="text-base font-black text-foreground">{title}</h2>{hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}</div>
    </div>
  );
}

function Avatar({ account, size }: { account: Pick<ExploreAccount, "name" | "avatarUrl">; size: number }) {
  const hue = hueOf(account.name);
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full font-black"
      style={{ width: size, height: size, fontSize: size * 0.4, background: account.avatarUrl ? undefined : `hsl(${hue} 75% 82%)`, color: `hsl(${hue} 55% 22%)`, boxShadow: `0 0 0 2px var(--background), 0 0 0 3.5px hsl(${hue} 70% 55%)` }}
    >
      {account.avatarUrl ? <OptimizedAvatar src={account.avatarUrl} alt="" width={size} className="h-full w-full object-cover" /> : account.name.replace(/^(حجت‌الاسلام|میدان)\s*/, "").charAt(0)}
    </span>
  );
}

export function FollowButton({ account, follow, large = false }: { account: ExploreAccount; follow: FollowApi; large?: boolean }) {
  const on = follow.isFollowing(account.type, account.id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={(event) => { event.preventDefault(); follow.toggle(account.type, account.id); }}
      className={`shrink-0 rounded-full border font-bold transition-colors active:scale-95 ${large ? "px-4 py-2 text-xs" : "px-4 py-1.5 text-[11px]"} ${on ? "border-border bg-surface-muted text-muted-foreground" : "border-transparent bg-foreground text-background"}`}
    >
      {on ? "دنبال می‌کنید" : "دنبال کردن"}
    </button>
  );
}

function Tags({ tags, onPick }: { tags: ExploreHome["tags"]; onPick: (tag: string) => void }) {
  if (!tags.length) return null;
  return (
    <section aria-label="ترند امروز">
      <Head icon={Hash} title="ترند امروز" hint="پربازدیدترین برچسب‌های میدان" />
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
        {tags.map((entry, index) => (
          <button key={entry.tag} type="button" onClick={() => onPick(`#${entry.tag}`)} className={`relative flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-right ${entry.hot ? "border-brand/30 bg-brand-muted" : "border-border bg-surface-muted"}`}>
            <i className={`text-2xl font-black not-italic ${entry.hot ? "text-brand" : "text-muted-foreground/60"}`}>{fa.format(index + 1)}</i>
            <span><b className="block text-sm font-black text-foreground">#{entry.tag}</b><small className="block text-[11px] text-muted-foreground">{compact.format(entry.count)} روایت</small></span>
            {entry.hot ? <Flame aria-hidden="true" className="h-3.5 w-3.5 text-brand" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function Suggestions({ entities, follow }: { entities: ExploreAccount[]; follow: FollowApi }) {
  if (!entities.length) return null;
  return (
    <section aria-label="پیشنهاد برای شما">
      <Head icon={Sparkles} title="پیشنهاد برای شما" hint="میدان‌ها و افراد" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
        {entities.map((entity) => (
          <article key={entity.key} className="flex w-[148px] shrink-0 flex-col items-center rounded-3xl border border-border bg-surface p-3.5 text-center">
            <Link href={entity.href as Route} className="flex flex-col items-center">
              <Avatar account={entity} size={64} />
              <b className="mt-2.5 flex max-w-full items-center gap-1 text-xs font-black text-foreground"><span className="truncate">{entity.name}</span><AccountBadges verified={entity.verified} kind={entity.type} size="sm" /></b>
              <small className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{entity.description || "میدان"}</small>
            </Link>
            <div className="mt-3"><FollowButton account={entity} follow={follow} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HotRow({ item, rank }: { item: ExploreHotNarrative; rank: number }) {
  return (
    <article className="relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-hover">
      <i className={`w-7 shrink-0 pt-0.5 text-center text-xl font-black not-italic ${rank <= 3 ? "text-brand" : "text-muted-foreground/60"}`}>{fa.format(rank)}</i>
      <Link href={item.href as Route} className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <b className="truncate text-[13px] font-black text-foreground">{item.authorName}</b>
          <AccountBadges verified={item.verified} speaker={item.speaker} official={item.official} kind={item.kind} size="sm" />
          {item.growth != null && item.growth > 0 ? <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-bold text-success"><TrendingUp aria-hidden="true" className="h-3 w-3" />{fa.format(item.growth)}٪</span> : null}
        </span>
        <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-foreground-secondary">{item.body}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Eye aria-hidden="true" className="h-3.5 w-3.5" />{compact.format(item.views)} بازدید</span>
      </Link>
      <BookmarkButton postId={item.id} bookmarked={false} className="self-start" />
    </article>
  );
}

function Hot({ items }: { items: ExploreHotNarrative[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="روایت‌های داغ">
      <Head icon={Flame} title="روایت‌های داغ" hint="در ۲۴ ساعت اخیر" />
      <div className="divide-y divide-divider border-y border-divider">{items.map((item, index) => <HotRow key={item.id} item={item} rank={index + 1} />)}</div>
    </section>
  );
}

function Active({ items, follow }: { items: ExploreHome["active"]; follow: FollowApi }) {
  if (!items.length) return null;
  return (
    <section aria-label="میدان‌های فعال">
      <Head icon={MapPin} title="میدان‌های فعال" hint="نزدیک‌ترین و پرجنب‌وجوش‌ترین‌ها" />
      <div className="grid grid-cols-2 gap-3 px-4">
        {items.map((entity) => (
          <article key={entity.key} className="relative flex flex-col items-center rounded-3xl border border-border p-3.5 text-center" style={{ background: `linear-gradient(160deg,hsl(${hueOf(entity.name)} 55% 16% / .55),transparent)` }}>
            {entity.live ? <em className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success-surface px-2 py-0.5 text-[9px] font-bold not-italic text-success"><i className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />زنده</em> : null}
            <Link href={entity.href as Route} className="flex flex-col items-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-foreground"><MapPin aria-hidden="true" className="h-5 w-5" /></span>
              <b className="mt-2 max-w-full truncate text-[13px] font-black text-foreground">{entity.name}</b>
              <small className="mt-0.5 text-[10px] text-muted-foreground">{entity.description ? `${entity.description} · ` : ""}{compact.format(entity.members)} عضو</small>
            </Link>
            <div className="mt-3"><FollowButton account={entity} follow={follow} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function People({ people, follow }: { people: ExploreAccount[]; follow: FollowApi }) {
  if (!people.length) return null;
  return (
    <section aria-label="افراد پیشنهادی">
      <Head icon={Users} title="افراد پیشنهادی" hint="فعالان، نویسندگان و سخنرانان" />
      <div className="divide-y divide-divider border-y border-divider">
        {people.map((person) => (
          <div key={person.key} className="flex items-center gap-3 px-4 py-3">
            <Link href={person.href as Route} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar account={person} size={52} />
              <span className="min-w-0"><b className="flex items-center gap-1 text-sm font-black text-foreground"><span className="truncate">{person.name}</span><AccountBadges verified={person.verified} speaker={person.speaker} official={person.official} kind={person.type} size="sm" /></b><small className="block truncate text-[11px] text-muted-foreground">{[person.description, `${compact.format(person.followers)} دنبال‌کننده`].filter(Boolean).join(" · ")}</small></span>
            </Link>
            <FollowButton account={person} follow={follow} large />
          </div>
        ))}
      </div>
    </section>
  );
}

function SpeakerBanner() {
  return (
    <Link href={"/speakers" as Route} className="mx-4 flex items-center gap-3.5 rounded-3xl border border-border bg-surface p-4 transition-colors hover:bg-hover">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-muted text-brand"><Mic aria-hidden="true" className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1"><b className="block text-sm font-black text-foreground">سخنران می‌خواهید؟</b><small className="block text-[11px] text-muted-foreground">از میان سخنرانان میدان انتخاب کنید یا ثبت‌نام کنید.</small></span>
      <ChevronLeft aria-hidden="true" className="h-5 w-5 text-icon-muted" />
    </Link>
  );
}

/** The sections of one explore tab, in the reference's order. */
export function ExploreSections({ sections, home, follow, onPickTag }: { sections: ExploreSection[]; home: ExploreHome; follow: FollowApi; onPickTag: (tag: string) => void }) {
  const render: Record<ExploreSection, ReactNode> = {
    tags: <Tags tags={home.tags} onPick={onPickTag} />,
    suggestions: <Suggestions entities={home.entities} follow={follow} />,
    hot: <Hot items={home.hot} />,
    active: <Active items={home.active} follow={follow} />,
    people: <People people={home.people} follow={follow} />,
    speakers: <SpeakerBanner />,
  };
  return <div className="space-y-8 pb-24 pt-5">{sections.map((section) => <div key={section}>{render[section]}</div>)}</div>;
}
