import { SpeechArchiveView } from "@/features/content/components/SpeechArchiveView";
import { getSpeechContentPage } from "@/features/content/services/content.service";

export const dynamic = "force-dynamic";

export default async function SpeechesPage() {
  return <SpeechArchiveView initial={await getSpeechContentPage()} />;
}
