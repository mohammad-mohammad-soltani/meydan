import { getContentBanners } from "@/features/content/services/banners.service";
import { ContentHubPager, type HubPayload } from "@/features/content/components/ContentHubPager";
import type { HubTab } from "@/features/content/components/ContentHubTabs";
import { getMusicVideoContentPage, getSpeechContentPage } from "@/features/content/services/content.service";
import { getAudioHub, getNotesHub } from "@/features/content/services/hub.service";
import { getReportDays } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";

async function loadTab(tab: HubTab): Promise<HubPayload> {
  if (tab === "ava") {
    const hub = await getAudioHub().catch(() => ({ featured: [], series: [], faces: [], squares: [], latest: [] }));
    return { tab: "ava", data: hub };
  }
  if (tab === "notes") {
    const hub = await getNotesHub().catch(() => ({ categories: [], featured: [], latest: [] }));
    return { tab: "notes", data: hub };
  }
  const [banners, speeches, musicVideos, reportDays] = await Promise.all([getContentBanners(), getSpeechContentPage(), getMusicVideoContentPage(), getReportDays()]);
  return { tab: "top", data: { banners, speeches: speeches.items, musicVideos: musicVideos.items, reportDays } };
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab: HubTab = requested === "ava" || requested === "notes" ? requested : "top";
  const initial = await loadTab(tab);
  return <ContentHubPager active={tab} initial={initial} />;
}
