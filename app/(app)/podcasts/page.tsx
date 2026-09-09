import { PodcastsView } from "@/features/podcasts/components/PodcastsView";
import { getPodcastEpisodes } from "@/features/podcasts/services/podcasts.service";

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  return <PodcastsView episodes={await getPodcastEpisodes()} />;
}
