import { SpeakersView } from "@/features/speakers/components/SpeakersView";
import { getSpeakerCategories, getSpeakers } from "@/features/speakers/services/speakers.service";

export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  const [speakers, categories] = await Promise.all([getSpeakers(), getSpeakerCategories()]);
  return <SpeakersView initialSpeakers={speakers} categories={categories} />;
}
