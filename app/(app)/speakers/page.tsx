import { SpeakersView } from "@/features/speakers/components/SpeakersView";
import { getSpeakers } from "@/features/speakers/services/speakers.service";

export default function SpeakersPage() {
  return <SpeakersView initialSpeakers={getSpeakers()} />;
}
