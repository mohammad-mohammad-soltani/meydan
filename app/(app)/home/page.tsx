import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPosts, getFollowSuggestions } from "@/features/feed/services/feed.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postsResult, suggestionsResult] = await Promise.allSettled([
    getFeedPosts(),
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

  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const suggestions =
    suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];

  return (
    <FeedView
      posts={posts}
      suggestions={suggestions}
      postsUnavailable={postsUnavailable}
      suggestionsUnavailable={suggestionsUnavailable}
    />
  );
}
