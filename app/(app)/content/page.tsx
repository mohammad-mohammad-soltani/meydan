import { ContentView } from "@/features/content/components/ContentView";
import { getContentPoster, getMusicVideoContentPage, getSpeechContentPage } from "@/features/content/services/content.service";
import { currentReportNight, getReportDays } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [poster, speeches, musicVideos, reportDays] = await Promise.all([getContentPoster(), getSpeechContentPage(), getMusicVideoContentPage(), getReportDays()]);
  const todayNight = currentReportNight();
  return <ContentView poster={poster} speeches={speeches.items} musicVideos={musicVideos.items} reportDays={reportDays} todayNight={todayNight} />;
}
