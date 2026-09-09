import { SpeakersView } from "@/features/speakers/components/SpeakersView";
import { getSpeakers } from "@/features/speakers/services/speakers.service";

export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  return <SpeakersView initialSpeakers={await getSpeakers()} />;
}
