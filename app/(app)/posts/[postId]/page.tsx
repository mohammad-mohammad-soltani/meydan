import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "@/features/posts/components/PostView";
import { getPostById } from "@/features/posts/services/posts.service";
import { accessTokenHeader } from "@/lib/meydan-session";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript, toDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ postId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId, { headers: await accessTokenHeader() });
  if (!post) return { title: "روایت | نقش من" };

  const title = `${post.author.name}: «${toDescription(post.body, 70)}»`;
  const description = toDescription(post.body);
  const url = absoluteUrl(`/posts/${post.id}`);
  const image = post.media.find((item) => item.previewSrc)?.previewSrc;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getPostById(postId, { headers: await accessTokenHeader() });

  if (!post) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "SocialMediaPosting",
          "@id": absoluteUrl(`/posts/${post.id}`),
          url: absoluteUrl(`/posts/${post.id}`),
          headline: toDescription(post.body, 110),
          articleBody: post.body,
          author: { "@type": "Person", name: post.author.name },
          interactionStatistic: [
            { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.likes },
            { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: post.commentsCount },
          ],
        })}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: "خانه", path: "/home" },
            { name: `روایت ${post.author.name}`, path: `/posts/${post.id}` },
          ]),
        )}
      />
      <PostView post={post} />
    </>
  );
}
