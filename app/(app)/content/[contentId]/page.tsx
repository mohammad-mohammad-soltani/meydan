import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentDetailView } from "@/features/content/components/ContentDetailView";
import {
  getContentDetailById,
  getContentDetailItems,
} from "@/features/content/services/content.service";
import { absoluteUrl, jsonLdScript, toDescription } from "@/lib/seo";

type ContentDetailPageProps = {
  params: Promise<{ contentId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ContentDetailPageProps): Promise<Metadata> {
  const { contentId } = await params;
  const item = await getContentDetailById(contentId);
  if (!item) return { title: "محتوا پیدا نشد | میدان خیابان" };

  const title = item.title;
  const description = toDescription(item.description);
  const url = absoluteUrl(`/content/${item.id}`);
  const image = item.media.coverImage;
  const isVideo = item.media.kind === "video";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: isVideo ? "video.other" : "article",
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

export default async function ContentDetailPage({
  params,
}: ContentDetailPageProps) {
  const { contentId } = await params;
  const item = await getContentDetailById(contentId);
  if (!item) notFound();

  const relatedItems = (await getContentDetailItems())
    .filter((candidate) => candidate.id !== item.id)
    .sort(
      (a, b) =>
        Number(b.category === item.category) -
        Number(a.category === item.category),
    )
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": item.media.kind === "video" ? "VideoObject" : "CreativeWork",
          name: item.title,
          description: item.description,
          url: absoluteUrl(`/content/${item.id}`),
          thumbnailUrl: item.media.coverImage,
          author: item.creator?.name ? { "@type": "Person", name: item.creator.name } : undefined,
        })}
      />
      <ContentDetailView item={item} relatedItems={relatedItems} />
    </>
  );
}
