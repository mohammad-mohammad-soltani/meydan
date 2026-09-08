import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPosts, getFollowSuggestions } from "@/features/feed/services/feed.service";

export default function HomePage() {
  return <FeedView posts={getFeedPosts()} suggestions={getFollowSuggestions()} />;
}
