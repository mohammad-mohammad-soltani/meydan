import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentDetailView } from "@/features/content/components/ContentDetailView";
import {
  getContentDetailById,
  getContentDetailItems,
} from "@/features/content/services/content.service";

type ContentDetailPageProps = {
  params: Promise<{ contentId: string }>;
};

export function generateStaticParams() {
  return getContentDetailItems().map((item) => ({ contentId: item.id }));
}

export async function generateMetadata({
  params,
}: ContentDetailPageProps): Promise<Metadata> {
  const { contentId } = await params;
  const item = getContentDetailById(contentId);
  if (!item) return { title: "محتوا پیدا نشد | میدان خیابان" };
  return {
    title: `${item.title} | میدان خیابان`,
    description: item.description,
  };
}

export default async function ContentDetailPage({
  params,
}: ContentDetailPageProps) {
  const { contentId } = await params;
  const item = getContentDetailById(contentId);
  if (!item) notFound();

  const relatedItems = getContentDetailItems()
    .filter((candidate) => candidate.id !== item.id)
    .sort(
      (a, b) =>
        Number(b.category === item.category) -
        Number(a.category === item.category),
    )
    .slice(0, 3);

  return <ContentDetailView item={item} relatedItems={relatedItems} />;
}
