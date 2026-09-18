import { SpeakersView } from "@/features/speakers/components/SpeakersView";
import { getSpeakerCategories, getSpeakers } from "@/features/speakers/services/speakers.service";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { isAuthenticated } from "@/lib/meydan-session";

export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  const authenticated = await isAuthenticated();
  const [speakers, categories, viewer] = await Promise.all([
    getSpeakers(),
    getSpeakerCategories(),
    authenticated ? getProfileDetails().catch(() => null) : null,
  ]);

  // Only a square account may invite, and its own registered address becomes
  // the venue; guests and personal accounts get the directory without invites.
  const canInvite = viewer?.accountType === "square";

  return (
    <SpeakersView
      initialSpeakers={speakers}
      categories={categories}
      canInvite={canInvite}
      venue={canInvite ? viewer?.identity.location || "" : ""}
    />
  );
}
