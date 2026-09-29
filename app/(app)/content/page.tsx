import { getContentBanners } from "@/features/content/services/banners.service";
import { ContentView } from "@/features/content/components/ContentView";
import { getMusicVideoContentPage, getSpeechContentPage } from "@/features/content/services/content.service";
import { currentReportNight, getReportDays } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [banners, speeches, musicVideos, reportDays] = await Promise.all([getContentBanners(), getSpeechContentPage(), getMusicVideoContentPage(), getReportDays()]);
  const todayNight = currentReportNight();
  return <ContentView banners={banners} speeches={speeches.items} musicVideos={musicVideos.items} reportDays={reportDays} todayNight={todayNight} />;
}
