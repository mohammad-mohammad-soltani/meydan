import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuotesView } from "@/features/posts/components/QuotesView";
import { getQuotesPage, type FeedPage } from "@/features/feed/services/feed.service";
import { accessTokenHeader } from "@/lib/meydan-session";

export const metadata: Metadata = { title: "نقل‌قول‌ها | نقش من" };
export const dynamic = "force-dynamic";

export default async function PostQuotesPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!/^\d+$/.test(postId)) notFound();

  let page: FeedPage;
  try {
    page = await getQuotesPage(postId, null, { headers: await accessTokenHeader() });
  } catch {
    notFound();
  }

  return <QuotesView postId={postId} initialPosts={page.posts} initialNextCursor={page.nextCursor} />;
}
