import type { Metadata } from "next";
import { DraftsView } from "@/features/coming-soon/DraftsView";

export const metadata: Metadata = { title: "پیش‌نویس‌ها | نقش من" };

export default function DraftsPage() {
  return <DraftsView />;
}
