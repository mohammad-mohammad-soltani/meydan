import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPage, getFollowSuggestions } from "@/features/feed/services/feed.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postsResult, suggestionsResult] = await Promise.allSettled([
    getFeedPage(),
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
      posts={feedPage.posts}
      nextCursor={feedPage.nextCursor}
      suggestions={suggestions}
      postsUnavailable={postsUnavailable}
      suggestionsUnavailable={suggestionsUnavailable}
    />
  );
}
