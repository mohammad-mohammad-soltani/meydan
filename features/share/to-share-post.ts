import { splitPostTitle } from "@/features/feed/post-title";
import type { FeedPost } from "@/features/feed/types";
import type { SharePost } from "./types";

/** A timeline/profile post in the shape the share sheet takes. */
export function toSharePost(post: FeedPost): SharePost {
  const { title, rest } = splitPostTitle(post.body);
  return {
    id: post.id,
    title,
    body: rest,
    authorName: post.squareName,
    authorAvatar: post.author.avatarUrl,
    authorVerified: Boolean(post.author.verified),
  };
}
