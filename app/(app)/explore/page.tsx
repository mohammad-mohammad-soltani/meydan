import type { Metadata } from "next";
import { ExploreView } from "@/features/explore/components/ExploreView";

export const metadata: Metadata = {
  title: "کاوش | نقش من",
  description: "جست‌وجوی روایت‌ها، میدان‌ها، کاربران، سخنران‌ها و محتوای میدان.",
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <ExploreView initialQuery={(q ?? "").slice(0, 80)} />;
}
