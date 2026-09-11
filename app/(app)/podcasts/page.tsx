import { getContentItems } from "@/features/content/services/content.service";
import { PodcastsView } from "@/features/podcasts/components/PodcastsView";

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  const items = await getContentItems();
  return <PodcastsView items={items} />;
}
