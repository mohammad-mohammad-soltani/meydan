import type { Metadata } from "next";
import { MusicVideoArchiveView } from "@/features/content/components/MusicVideoArchiveView";
import { getMusicVideoContentPage } from "@/features/content/services/content.service";

export const metadata: Metadata = { title: "آوا و نوا | میدان خیابان" };
export const dynamic = "force-dynamic";

export default async function MusicVideosPage() {
  return <MusicVideoArchiveView initial={await getMusicVideoContentPage()} />;
}
