import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPosts, getFollowSuggestions } from "@/features/feed/services/feed.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, suggestions] = await Promise.all([
    getFeedPosts(),
    getFollowSuggestions(),
  ]);
  return <FeedView posts={posts} suggestions={suggestions} />;
}
