import type { Metadata } from "next";
import { ExploreView } from "@/features/explore/components/ExploreView";

export const metadata: Metadata = {
  title: "کاوش | میدانِ خیابان",
  description: "جست‌وجوی روایت‌ها، میدان‌ها، کاربران، سخنران‌ها و محتوای میدان.",
};

export default function ExplorePage() {
  return <ExploreView />;
}
