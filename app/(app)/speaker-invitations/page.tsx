import type { Metadata } from "next";
import { SpeakerInvitationsView } from "@/features/speaker-invitations/components/SpeakerInvitationsView";
import {
  getInvitableCategories,
  getSpeakerInvitations,
} from "@/features/speaker-invitations/services/speaker-invitations.service";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { accessTokenHeader } from "@/lib/meydan-session";

export const metadata: Metadata = { title: "دعوت‌های سخنرانی | نقش من" };
export const dynamic = "force-dynamic";

export default async function SpeakerInvitationsPage() {
  // Both boxes are fetched so the tabs render populated on first paint; a guest
  // without a session simply gets empty lists. The session has to be forwarded
  // explicitly: `meydanApi` does not attach it on its own, and without it the
  // API answers 401 and the badges would only appear after a tab switch.
  const authHeaders = await accessTokenHeader();
  const [received, sent, categories, profile] = await Promise.all([
    getSpeakerInvitations("received", authHeaders).catch(() => []),
    getSpeakerInvitations("sent", authHeaders).catch(() => []),
    getInvitableCategories(authHeaders).catch(() => []),
    getProfileDetails().catch(() => null),
  ]);

  // Only square accounts invite; the venue preview comes from that same profile.
  const canInvite = profile?.accountType === "square";

  return (
    <SpeakerInvitationsView
      initialReceived={received}
      initialSent={sent}
      categories={categories}
      canInvite={canInvite}
      venue={canInvite ? profile?.identity.location || "" : ""}
    />
  );
}
