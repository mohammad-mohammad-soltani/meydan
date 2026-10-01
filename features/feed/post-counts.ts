import type { FeedPost } from "./types";

/** The repost button counts plain reposts and quotes together, like the rest of the timeline. */
export function repostTotal(stats: Pick<FeedPost["stats"], "reposts" | "quotes">): number {
  return Math.max(0, stats.reposts) + Math.max(0, stats.quotes ?? 0);
}

/** Where the composer opens to quote a post. */
export function quoteComposeHref(postId: string): string {
  return `/compose?quote=${encodeURIComponent(postId)}`;
}
