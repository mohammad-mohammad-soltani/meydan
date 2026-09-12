import type { ReactNode } from "react";

type SkeletonProps = { className?: string };

function Block({ className = "" }: SkeletonProps) {
  return <span className={`block rounded-lg bg-skeleton ${className}`} />;
}

function SkeletonShell({ children }: { children: ReactNode }) {
  return <section aria-busy="true" aria-live="polite" className="ui-enter min-h-full w-full bg-background px-4 py-5 pb-24 text-foreground"><div className="mx-auto w-full max-w-xl animate-pulse space-y-4">{children}</div><span className="sr-only">در حال بارگذاری صفحه</span></section>;
}

function StoryCard({ compact = false }: { compact?: boolean }) {
  return <article className="rounded-card border border-border p-4"><div className="flex items-center gap-3"><Block className="h-11 w-11 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-36" /><Block className="h-2.5 w-24 bg-skeleton-highlight" /></div><Block className="h-9 w-9 shrink-0 rounded-full" /></div><div className="mt-5 space-y-2.5"><Block className="h-3 w-full bg-skeleton-highlight" /><Block className="h-3 w-11/12 bg-skeleton-highlight" />{!compact ? <Block className="h-3 w-4/5 bg-skeleton-highlight" /> : null}</div>{!compact ? <div className="mt-5 grid grid-cols-3 gap-2"><Block className="h-20" /><Block className="h-20" /><Block className="h-20" /></div> : null}</article>;
}

export function FeedRouteSkeleton() {
  return <SkeletonShell><div className="flex h-10 overflow-hidden border-b border-divider"><Block className="h-full flex-1 rounded-none" /><Block className="mx-6 h-full flex-1 rounded-none bg-skeleton-highlight" /></div><div className="flex gap-2 overflow-hidden"><Block className="h-9 w-28 shrink-0 rounded-full" /><Block className="h-9 w-32 shrink-0 rounded-full" /><Block className="h-9 w-28 shrink-0 rounded-full" /></div><Block className="h-12 w-full rounded-none bg-warning-surface" /><StoryCard /><StoryCard compact /></SkeletonShell>;
}

export function ContentRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-40" /><Block className="h-3 w-64 bg-skeleton-highlight" /></div><div className="flex gap-2"><Block className="h-9 w-20 rounded-full" /><Block className="h-9 w-24 rounded-full" /><Block className="h-9 w-20 rounded-full" /></div><div className="grid grid-cols-2 gap-3"><Block className="h-40" /><Block className="h-40" /><Block className="h-40" /><Block className="h-40" /></div></SkeletonShell>;
}

export function SpeakersRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-36" /><Block className="h-10 w-full rounded-xl bg-skeleton-highlight" /></div><div className="flex gap-2"><Block className="h-8 w-20 rounded-full" /><Block className="h-8 w-24 rounded-full" /><Block className="h-8 w-16 rounded-full" /></div><div className="space-y-3">{[0, 1, 2].map((index) => <article key={index} className="flex gap-3 rounded-card border border-border p-3"><Block className="h-16 w-16 shrink-0 rounded-full" /><div className="flex-1 space-y-2 pt-1"><Block className="h-3 w-32" /><Block className="h-2.5 w-24 bg-skeleton-highlight" /><Block className="h-7 w-20 rounded-lg" /></div></article>)}</div></SkeletonShell>;
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

export function ProfileRouteSkeleton() {
  return <SkeletonShell><Block className="h-28 w-full rounded-2xl" /><div className="-mt-10 flex items-end gap-3 px-3"><Block className="h-20 w-20 shrink-0 rounded-full border-4 border-surface" /><div className="space-y-2 pb-1"><Block className="h-4 w-32" /><Block className="h-2.5 w-24 bg-skeleton-highlight" /></div></div><div className="grid grid-cols-2 gap-2"><Block className="h-10" /><Block className="h-10" /></div><StoryCard compact /></SkeletonShell>;
}

export function PostRouteSkeleton() {
  return <SkeletonShell><StoryCard /><div className="space-y-3 border-t border-divider pt-4"><Block className="h-4 w-20" />{[0, 1, 2].map((index) => <div key={index} className="flex gap-3"><Block className="h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Block className="h-2.5 w-24" /><Block className="h-2.5 w-5/6 bg-skeleton-highlight" /></div></div>)}</div></SkeletonShell>;
}

export function ComposeRouteSkeleton() {
  return <SkeletonShell><div className="flex items-center justify-between"><Block className="h-5 w-24" /><Block className="h-8 w-16 rounded-lg" /></div><Block className="h-28 w-full rounded-2xl bg-skeleton-highlight" /><div className="grid grid-cols-3 gap-2"><Block className="h-20" /><Block className="h-20" /><Block className="h-20" /></div><Block className="h-11 w-full rounded-xl" /></SkeletonShell>;
}

export function ParticipantsRouteSkeleton() {
  return <SkeletonShell><header className="flex items-center gap-3 border-b border-divider pb-4"><Block className="h-8 w-8 shrink-0 rounded-full" /><div className="space-y-2"><Block className="h-3.5 w-48" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div></header><div className="overflow-hidden rounded-card border border-border"><div className="divide-y divide-divider">{[0, 1, 2, 3, 4].map((index) => <div key={index} className="flex items-center gap-3 px-4 py-3"><Block className="h-11 w-11 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-32" /><Block className="h-2.5 w-20 bg-skeleton-highlight" /></div></div>)}</div></div></SkeletonShell>;
}

export function PodcastsRouteSkeleton() {
  return <SkeletonShell><div className="space-y-2"><Block className="h-5 w-32" /><Block className="h-3 w-52 bg-skeleton-highlight" /></div><div className="space-y-3">{[0, 1, 2, 3].map((index) => <article key={index} className="flex gap-3 rounded-card border border-border p-3"><Block className="h-16 w-16 shrink-0 rounded-xl" /><div className="flex-1 space-y-2 pt-1"><Block className="h-3 w-4/5" /><Block className="h-2.5 w-2/5 bg-skeleton-highlight" /><Block className="h-2.5 w-16 bg-skeleton-highlight" /></div></article>)}</div></SkeletonShell>;
}
