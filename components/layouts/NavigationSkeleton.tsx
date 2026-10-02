import type { HTMLAttributes } from "react";
import { PostCardSkeleton } from "@/features/feed/components/FeedSkeleton";

type NavigationSkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Immediate visual feedback while an App Router navigation resolves: a quiet header and two cards in the feed's own shape. */
export function NavigationSkeleton({ className = "", ...props }: NavigationSkeletonProps) {
  return (
    <div className={`overflow-hidden bg-background ${className}`} aria-busy="true" aria-live="polite" {...props}>
      <div aria-hidden="true" className="border-b border-divider px-4 py-3.5"><span className="block h-4 w-28 animate-pulse rounded-md bg-skeleton" /></div>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <span className="sr-only">در حال باز کردن صفحه</span>
    </div>
  );
}
