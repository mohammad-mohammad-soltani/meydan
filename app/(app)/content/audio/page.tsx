import type { Metadata } from "next";
import { AudioListView, ProducerListView } from "@/features/content/components/AudioListView";
import { getAudioList, getProducerPage } from "@/features/content/services/hub.service";

export const metadata: Metadata = { title: "آوا | نقش من" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ shelf?: string; series?: string }>;

/** «مشاهده همه» of the آوا shelves: featured, newest, one series, or the people / squares behind the audio. */
export default async function AudioPage({ searchParams }: { searchParams: SearchParams }) {
  const { shelf, series } = await searchParams;

  if (shelf === "faces" || shelf === "squares") {
    const page = await getProducerPage(shelf).catch(() => ({ items: [], nextOffset: null }));
    return <ProducerListView kind={shelf} initialItems={page.items} initialOffset={page.nextOffset} />;
  }

  const query = series ? { series } : { featured: shelf === "featured" };
  const page = await getAudioList(query).catch(() => ({ items: [], nextCursor: null }));
  const title = series ? series : shelf === "featured" ? "ویژه‌ها" : "آخرین صوت‌ها";
  return <AudioListView title={title} subtitle={series ? "سلسله سخنرانی" : undefined} query={query} initialItems={page.items} initialCursor={page.nextCursor} />;
}
