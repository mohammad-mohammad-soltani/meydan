import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPage, getFollowSuggestions } from "@/features/feed/services/feed.service";
import { FEED_FILTERS, type FeedFilter } from "@/features/feed/types";
import { accessTokenHeader } from "@/lib/meydan-session";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  // `?filter=` opens the feed on one chip (used by the mobile drawer links).
  const requested = (await searchParams).filter;
  const filter: FeedFilter = FEED_FILTERS.includes(requested as FeedFilter) ? (requested as FeedFilter) : "all";
  const authHeaders = await accessTokenHeader();
  const [postsResult, suggestionsResult] = await Promise.allSettled([
    getFeedPage(filter === "all" ? {} : { filter }, { headers: authHeaders }),
    getFollowSuggestions(),
  ]);

  const postsUnavailable = postsResult.status === "rejected";
  const suggestionsUnavailable = suggestionsResult.status === "rejected";

  if (postsUnavailable) {
    console.error("[meydan] home feed request failed", postsResult.reason);
  }
  if (suggestionsUnavailable) {
    console.error("[meydan] home suggestions request failed", suggestionsResult.reason);
  }

  const feedPage = postsResult.status === "fulfilled" ? postsResult.value : { posts: [], nextCursor: null };
  const suggestions =
    suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];

  return (
    <FeedView
      key={filter}
      initialFilter={filter}
      posts={feedPage.posts}
      nextCursor={feedPage.nextCursor}
      suggestions={suggestions}
      postsUnavailable={postsUnavailable}
      suggestionsUnavailable={suggestionsUnavailable}
    />
  );
}
