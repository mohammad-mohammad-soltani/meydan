import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "@/features/posts/components/PostView";
import { getPostById } from "@/features/posts/services/posts.service";

export const metadata: Metadata = { title: "روایت | نقش من" };
export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getPostById(postId);

  if (!post) notFound();

  return <PostView post={post} />;
}
