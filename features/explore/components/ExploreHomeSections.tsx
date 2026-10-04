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
    <div className="reference-explore-section-head mb-3.5 flex items-center gap-[11px] px-[18px]">
      <span className="reference-explore-section-icon grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[13px]"><Icon aria-hidden="true" className="h-[18px] w-[18px]" /></span>
      <div className="min-w-0"><h2 className="text-[17.5px] font-extrabold text-foreground">{title}</h2>{hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}</div>
    </div>
  );
}

function Avatar({ account, size }: { account: Pick<ExploreAccount, "name" | "avatarUrl">; size: number }) {
  const hue = hueOf(account.name);
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full font-black"
      style={{ width: size, height: size, fontSize: size * 0.4, background: account.avatarUrl ? undefined : `hsl(${hue} 88% 82%)`, color: `hsl(${hue} 50% 27%)`, boxShadow: `0 0 0 3px var(--m-bg), 0 0 0 5px hsl(${hue} 85% 68%)` }}
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
      className={`reference-explore-follow shrink-0 rounded-full border font-bold transition-colors active:scale-95 ${large ? "h-[38px] px-5 text-[13px]" : "h-[34px] px-[18px] text-[12.5px]"} ${on ? "border-border bg-transparent text-foreground" : "border-transparent bg-foreground text-background"}`}
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
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-[18px]">
        {tags.map((entry, index) => (
          <button key={entry.tag} type="button" onClick={() => onPick(`#${entry.tag}`)} className={`reference-explore-tag relative flex min-w-[150px] shrink-0 items-center gap-2.5 rounded-[20px] border pl-3.5 pr-4 py-2.5 text-right ${entry.hot ? "reference-explore-tag-hot border-brand/30 bg-brand-muted" : "border-border bg-surface-muted"}`}>
            <i className={`text-2xl font-black not-italic ${entry.hot ? "text-brand" : "text-muted-foreground/60"}`}>{fa.format(index + 1)}</i>
            <span><b className="block text-sm font-black text-foreground">#{entry.tag}</b><small className="block text-xs text-muted-foreground">{compact.format(entry.count)} روایت</small></span>
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
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-[18px]">
        {entities.map((entity) => (
          <article key={entity.key} className="reference-explore-suggestion flex w-[148px] shrink-0 flex-col items-center rounded-3xl border border-border bg-surface-muted px-3 pb-3.5 pt-5 text-center">
            <Link href={entity.href as Route} className="flex flex-col items-center">
              <Avatar account={entity} size={64} />
              <b className="mt-2 flex max-w-full items-center gap-1 text-sm font-bold text-foreground"><span className="truncate">{entity.name}</span><AccountBadges verified={entity.verified} kind={entity.type} size="sm" /></b>
              <small className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{entity.description || "میدان"}</small>
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
    <article className="reference-explore-hot-row relative flex gap-3.5 px-[18px] py-4 transition-colors hover:bg-hover">
      <i className={`w-[34px] shrink-0 pt-1 text-center text-[26px] leading-none font-black not-italic ${rank <= 3 ? "text-brand" : "text-muted-foreground/60"}`}>{fa.format(rank)}</i>
      <Link href={item.href as Route} className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <b className="truncate text-[15px] font-extrabold text-foreground">{item.authorName}</b>
          <AccountBadges verified={item.verified} speaker={item.speaker} official={item.official} kind={item.kind} size="sm" />
          {item.growth != null && item.growth > 0 ? <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-bold text-success"><TrendingUp aria-hidden="true" className="h-3 w-3" />{fa.format(item.growth)}٪</span> : null}
        </span>
        <p className="mt-1.5 line-clamp-2 text-sm leading-[1.95] text-foreground-secondary">{item.body}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Eye aria-hidden="true" className="h-3.5 w-3.5" />{compact.format(item.views)} بازدید</span>
      </Link>
      <BookmarkButton postId={item.id} bookmarked={item.bookmarked} className="self-start" />
    </article>
  );
}

function Hot({ items }: { items: ExploreHotNarrative[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="روایت‌های داغ">
      <Head icon={Flame} title="روایت‌های داغ" hint="در ۲۴ ساعت اخیر" />
      <div className="divide-y divide-divider">{items.map((item, index) => <HotRow key={item.id} item={item} rank={index + 1} />)}</div>
    </section>
  );
}

function Active({ items, follow }: { items: ExploreHome["active"]; follow: FollowApi }) {
  if (!items.length) return null;
  return (
    <section aria-label="میدان‌های فعال">
      <Head icon={MapPin} title="میدان‌های فعال" hint="نزدیک‌ترین و پرجنب‌وجوش‌ترین‌ها" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 px-[18px]">
        {items.map((entity) => (
          <article key={entity.key} className="reference-explore-field relative flex flex-col items-start rounded-3xl border border-border p-4 text-right" style={{ background: `linear-gradient(150deg,color-mix(in srgb,hsl(${hueOf(entity.name)} 75% 52%) 22%,var(--m-soft)),var(--m-soft) 75%)` }}>
            {entity.live ? <em className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-[11px] font-bold not-italic text-[#f0243a]"><i className="size-[7px] rounded-full bg-[#f0243a] motion-safe:animate-pulse" />زنده</em> : null}
            <Link href={entity.href as Route} className="flex flex-col items-start">
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-[14px] bg-brand-muted text-brand"><MapPin aria-hidden="true" className="h-5 w-5" /></span>
              <b className="mt-2 max-w-full truncate text-[15px] font-extrabold text-foreground">{entity.name}</b>
              <small className="mt-1 text-xs text-muted-foreground">{entity.description ? `${entity.description} · ` : ""}{compact.format(entity.members)} عضو</small>
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
      <div className="divide-y divide-divider">
        {people.map((person) => (
          <div key={person.key} className="flex items-center gap-3 px-[18px] py-3">
            <Link href={person.href as Route} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar account={person} size={52} />
              <span className="min-w-0"><b className="flex items-center gap-1 text-sm font-black text-foreground"><span className="truncate">{person.name}</span><AccountBadges verified={person.verified} speaker={person.speaker} official={person.official} kind={person.type} size="sm" /></b><small className="block truncate text-xs text-muted-foreground">{[person.description, `${compact.format(person.followers)} دنبال‌کننده`].filter(Boolean).join(" · ")}</small></span>
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
    <Link href={"/speakers" as Route} className="reference-explore-speaker-callout mx-3.5 mt-[26px] flex items-center gap-3.5 rounded-[26px] p-[18px] transition-colors hover:bg-hover">
      <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-[17px] bg-white/20 text-white"><Mic aria-hidden="true" className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1"><b className="block text-[16.5px] font-extrabold text-white">سخنران می‌خواهید؟</b><small className="mt-1 block text-[12.5px] leading-[1.8] text-white/85">از میان سخنرانان میدان انتخاب کنید یا ثبت‌نام کنید.</small></span>
      <ChevronLeft aria-hidden="true" className="h-5 w-5 text-white" />
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
  return <div className="reference-explore-sections pb-24">{sections.map((section) => <div key={section}>{render[section]}</div>)}</div>;
}
