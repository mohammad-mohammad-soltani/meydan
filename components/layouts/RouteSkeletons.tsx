import type { ReactNode } from "react";
import { Bone, PostCardSkeleton } from "@/features/feed/components/FeedSkeleton";

type SkeletonProps = { className?: string };

function Block({ className = "" }: SkeletonProps) {
  return <span className={`block bg-skeleton ${/\brounded/.test(className) ? "" : "rounded-lg"} ${className}`} />;
}

function SkeletonShell({ children }: { children: ReactNode }) {
  return <section aria-busy="true" aria-live="polite" className="ui-enter min-h-full w-full bg-background px-4 py-5 pb-24 text-foreground"><div className="mx-auto w-full max-w-xl animate-pulse space-y-4">{children}</div><span className="sr-only">در حال بارگذاری صفحه</span></section>;
}

/** Full-bleed shell for the pages whose real layout has no side padding (feed, profile, post, compose). */
function BleedShell({ children, label = "در حال بارگذاری صفحه" }: { children: ReactNode; label?: string }) {
  return <section aria-busy="true" aria-live="polite" className="ui-enter min-h-full w-full bg-background text-foreground">{children}<span className="sr-only">{label}</span></section>;
}

/** Tab strip skeleton: the same sticky bar with a selected first tab. */
export function TabsSkeleton({ count = 2, spread = true }: { count?: number; spread?: boolean }) {
  return (
    <div aria-hidden="true" className={`flex gap-0.5 border-b border-divider px-3 pt-2.5 ${spread ? "" : "overflow-hidden"}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`relative flex items-center justify-center px-3.5 pb-[15px] pt-[9px] ${spread ? "flex-1" : ""}`}>
          <Bone className={`h-3.5 ${index === 0 ? "w-14 bg-skeleton-highlight" : "w-12"}`} />
          {index === 0 ? <span className="absolute inset-x-3.5 bottom-0 h-[2.5px] animate-pulse rounded bg-foreground/60" /> : null}
        </div>
      ))}
    </div>
  );
}

function ChipsSkeleton({ widths }: { widths: string[] }) {
  return <div aria-hidden="true" className="flex gap-2 overflow-hidden px-3 py-2.5">{widths.map((width, index) => <Bone key={index} className={`h-8 shrink-0 rounded-full ${width} ${index === 0 ? "bg-skeleton-highlight" : ""}`} />)}</div>;
}

export function FeedRouteSkeleton() {
  return <BleedShell label="در حال بارگذاری روایت‌ها"><TabsSkeleton /><ChipsSkeleton widths={["w-14", "w-16", "w-14", "w-28"]} /><PostCardSkeleton /><PostCardSkeleton media /><PostCardSkeleton /></BleedShell>;
}

export function ContentRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-40" /><Block className="h-3 w-64 bg-skeleton-highlight" /></div><div className="flex gap-2"><Block className="h-9 w-20 rounded-full" /><Block className="h-9 w-24 rounded-full" /><Block className="h-9 w-20 rounded-full" /></div><div className="grid grid-cols-2 gap-3"><Block className="h-40" /><Block className="h-40" /><Block className="h-40" /><Block className="h-40" /></div></SkeletonShell>;
}

export function SpeakersRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-36" /><Block className="h-10 w-full rounded-full bg-skeleton-highlight" /></div><div className="flex gap-2"><Block className="h-8 w-20 rounded-full" /><Block className="h-8 w-24 rounded-full" /><Block className="h-8 w-16 rounded-full" /></div><div className="space-y-3">{[0, 1, 2].map((index) => <article key={index} className="flex items-start gap-3 rounded-card border border-border p-4"><Block className="h-12 w-12 shrink-0 rounded-full" /><div className="flex-1 space-y-2 pt-1"><Block className="h-3 w-32" /><Block className="h-2.5 w-24 bg-skeleton-highlight" /><Block className="h-2.5 w-4/5 bg-skeleton-highlight" /><Block className="h-7 w-20 rounded-full" /></div></article>)}</div></SkeletonShell>;
}

export function SpeakerInvitationsRouteSkeleton() {
  return <SkeletonShell><div className="flex items-start gap-3"><Block className="h-8 w-8 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-4 w-32" /><Block className="h-2.5 w-44 bg-skeleton-highlight" /></div><Block className="h-9 w-24 shrink-0 rounded-full" /></div><Block className="h-11 w-full rounded-full bg-skeleton-highlight" /><div className="space-y-3">{[0, 1, 2].map((index) => <article key={index} className="rounded-card border border-border p-4"><div className="flex items-center gap-3"><Block className="h-11 w-11 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-28" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div><Block className="h-6 w-20 shrink-0 rounded-full" /></div><div className="mt-3 space-y-2"><Block className="h-2.5 w-3/5 bg-skeleton-highlight" /><Block className="h-2.5 w-2/5 bg-skeleton-highlight" /></div></article>)}</div></SkeletonShell>;
}

export function MapRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-28" /><div className="grid grid-cols-2 gap-3"><Block className="h-11" /><Block className="h-11" /></div></div><div className="overflow-hidden rounded-card border border-border"><Block className="h-72 w-full rounded-none bg-skeleton-highlight" /><div className="space-y-2 p-4"><Block className="h-3 w-40" /><Block className="h-2.5 w-28 bg-skeleton-highlight" /></div></div></SkeletonShell>;
}

export function ChatRouteSkeleton() {
  return <SkeletonShell><div className="flex items-center justify-between"><Block className="h-5 w-24" /><Block className="h-8 w-20 rounded-full" /></div><div className="space-y-2">{[0, 1, 2, 3, 4].map((index) => <div key={index} className="flex items-center gap-3 rounded-card border border-border p-3"><Block className="h-12 w-12 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-28" /><Block className="h-2.5 w-4/5 bg-skeleton-highlight" /></div><Block className="h-2.5 w-9 shrink-0 bg-skeleton-highlight" /></div>)}</div></SkeletonShell>;
}

export function ConversationRouteSkeleton() {
  return <SkeletonShell><header className="flex items-center gap-3 border-b border-divider pb-4"><Block className="h-9 w-9 rounded-xl" /><Block className="h-11 w-11 rounded-full" /><div className="space-y-2"><Block className="h-3 w-28" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div></header><div className="space-y-3 py-4"><Block className="mr-auto h-14 w-3/5 rounded-2xl bg-skeleton-highlight" /><Block className="ml-auto h-16 w-2/3 rounded-2xl" /><Block className="mr-auto h-12 w-1/2 rounded-2xl bg-skeleton-highlight" /><Block className="ml-auto h-14 w-3/5 rounded-2xl" /></div><Block className="h-12 w-full rounded-xl bg-skeleton-highlight" /></SkeletonShell>;
}

/** The profile header as it will look: cover, avatar between the counts, identity, bio, chips and two actions. */
export function ProfileHeaderSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-48 w-full rounded-none rounded-b-[2rem]" />
      <div className="px-4 pb-5">
        <div className="-mt-14 grid grid-cols-[1fr_auto_1fr] items-end">
          <div className="flex flex-col items-center gap-1.5 pb-2"><Bone className="h-5 w-12" /><Bone className="h-2.5 w-14 bg-skeleton-highlight" /></div>
          <Bone className="h-28 w-28 rounded-full border-4 border-background" />
          <div className="flex flex-col items-center gap-1.5 pb-2"><Bone className="h-5 w-8" /><Bone className="h-2.5 w-10 bg-skeleton-highlight" /></div>
        </div>
        <div className="mt-3 flex flex-col items-center gap-2">
          <Bone className="h-6 w-40" />
          <Bone className="h-2.5 w-24 bg-skeleton-highlight" />
          <div className="mt-2 w-full max-w-md space-y-2"><Bone className="mx-auto h-3 w-full bg-skeleton-highlight" /><Bone className="mx-auto h-3 w-4/5 bg-skeleton-highlight" /></div>
        </div>
        <div className="mt-3 flex justify-center gap-2"><Bone className="h-6 w-20 rounded-full" /><Bone className="h-6 w-28 rounded-full" /></div>
        <div className="mt-5 grid grid-cols-2 gap-2.5"><Bone className="h-11 rounded-full bg-skeleton-highlight" /><Bone className="h-11 rounded-full" /></div>
      </div>
    </div>
  );
}

export function ProfileRouteSkeleton() {
  return <BleedShell label="در حال بارگذاری نمایه"><ProfileHeaderSkeleton /><TabsSkeleton count={5} spread={false} /><PostCardSkeleton /><PostCardSkeleton media /></BleedShell>;
}

export function PostRouteSkeleton() {
  return (
    <BleedShell label="در حال بارگذاری روایت">
      <div aria-hidden="true" className="flex h-14 items-center gap-3 border-b border-divider px-3"><Bone className="h-10 w-10 rounded-full" /><Bone className="h-4 w-28" /></div>
      <PostCardSkeleton media lines={5} />
      <div aria-hidden="true" className="space-y-4 border-t border-divider px-4 py-4">
        <Bone className="h-4 w-20" />
        {[0, 1, 2].map((index) => <div key={index} className="flex gap-3"><Bone className="h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Bone className="h-2.5 w-24" /><Bone className="h-2.5 w-5/6 bg-skeleton-highlight" /></div></div>)}
      </div>
    </BleedShell>
  );
}

export function ComposeRouteSkeleton() {
  return (
    <BleedShell label="در حال آماده‌سازی نوشتن">
      <div aria-hidden="true" className="flex items-center justify-between border-b border-divider px-4 py-2.5"><Bone className="h-4 w-16" /><div className="flex gap-2"><Bone className="h-8 w-24 rounded-full" /><Bone className="h-8 w-20 rounded-full bg-skeleton-highlight" /></div></div>
      <div aria-hidden="true" className="space-y-4 px-4 pt-4">
        <Bone className="h-12 w-full rounded-2xl" />
        <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><Bone className="h-10 w-10 rounded-full" /><div className="space-y-2"><Bone className="h-3 w-24" /><Bone className="h-2.5 w-20 bg-skeleton-highlight" /></div></div><Bone className="h-8 w-36 rounded-full" /></div>
        <div className="space-y-3 pt-2"><Bone className="h-3.5 w-3/5 bg-skeleton-highlight" /><Bone className="h-3.5 w-2/5 bg-skeleton-highlight" /></div>
      </div>
      <div aria-hidden="true" className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-divider px-4 py-3"><div className="flex gap-4">{[0, 1, 2, 3, 4].map((index) => <Bone key={index} className="h-6 w-6 rounded-md" />)}</div><Bone className="h-5 w-16 rounded-full" /></div>
    </BleedShell>
  );
}

export function BookmarksRouteSkeleton() {
  return <BleedShell label="در حال بارگذاری نشان‌شده‌ها"><div aria-hidden="true" className="border-b border-divider px-4 py-3"><Bone className="h-4 w-24" /></div><TabsSkeleton /><PostCardSkeleton /><PostCardSkeleton /></BleedShell>;
}

export function ParticipantsRouteSkeleton() {
  return <SkeletonShell><header className="flex items-center gap-3 border-b border-divider pb-4"><Block className="h-8 w-8 shrink-0 rounded-full" /><div className="space-y-2"><Block className="h-3.5 w-48" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div></header><div className="overflow-hidden rounded-card border border-border"><div className="divide-y divide-divider">{[0, 1, 2, 3, 4].map((index) => <div key={index} className="flex items-center gap-3 px-4 py-3"><Block className="h-11 w-11 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-32" /><Block className="h-2.5 w-20 bg-skeleton-highlight" /></div></div>)}</div></div></SkeletonShell>;
}

export function PodcastsRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-32" /><Block className="h-3 w-52 bg-skeleton-highlight" /></div><div className="space-y-3">{[0, 1, 2, 3].map((index) => <article key={index} className="flex gap-3 rounded-card border border-border p-3"><Block className="h-16 w-16 shrink-0 rounded-xl" /><div className="flex-1 space-y-2 pt-1"><Block className="h-3 w-4/5" /><Block className="h-2.5 w-2/5 bg-skeleton-highlight" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div></article>)}</div></SkeletonShell>;
}
