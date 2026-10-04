import { getContentBanners } from "@/features/content/services/banners.service";
import { AvaView } from "@/features/content/components/AvaView";
import { ContentHubTabs, type HubTab } from "@/features/content/components/ContentHubTabs";
import { HubSwipe } from "@/features/content/components/HubSwipe";
import { ContentView } from "@/features/content/components/ContentView";
import { NotesView } from "@/features/content/components/NotesView";
import { getMusicVideoContentPage, getSpeechContentPage } from "@/features/content/services/content.service";
import { getAudioHub, getNotesHub } from "@/features/content/services/hub.service";
import { getReportDays } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab: HubTab = requested === "ava" || requested === "notes" ? requested : "top";

  if (tab === "ava") {
    const hub = await getAudioHub().catch(() => ({ featured: [], series: [], faces: [], squares: [], latest: [] }));
    return <><ContentHubTabs active="ava" /><HubSwipe active="ava"><AvaView initial={hub} /></HubSwipe></>;
  }
  if (tab === "notes") {
    const hub = await getNotesHub().catch(() => ({ categories: [], featured: [], latest: [] }));
    return <><ContentHubTabs active="notes" /><HubSwipe active="notes"><NotesView initial={hub} /></HubSwipe></>;
  }

  const [banners, speeches, musicVideos, reportDays] = await Promise.all([getContentBanners(), getSpeechContentPage(), getMusicVideoContentPage(), getReportDays()]);
  return (
    <>
      <ContentHubTabs active="top" />
      <HubSwipe active="top">
        <ContentView banners={banners} speeches={speeches.items} musicVideos={musicVideos.items} reportDays={reportDays} todayNight={reportDays.length} />
      </HubSwipe>
    </>
  );
}
