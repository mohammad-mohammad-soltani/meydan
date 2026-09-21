"use client";

import { PostCard } from "@/features/feed/components/PostCard";
import type { FeedPost } from "@/features/feed/types";

export function ReportPostCard({ post }: { post: FeedPost }) {
  return <PostCard post={post} variant="timeline" liked={false} reposted={false} joined={false} onLike={() => undefined} onRepost={() => undefined} onShare={() => undefined} onJoin={() => undefined} onOpenMedia={() => undefined} hideActions />;
}
