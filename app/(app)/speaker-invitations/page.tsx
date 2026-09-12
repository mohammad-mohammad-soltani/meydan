import type { Metadata } from "next";
import { SpeakerInvitationsView } from "@/features/speaker-invitations/components/SpeakerInvitationsView";
import {
  getInvitableCategories,
  getSpeakerInvitations,
} from "@/features/speaker-invitations/services/speaker-invitations.service";
import { getProfileDetails } from "@/features/profile/services/profile.service";

export const metadata: Metadata = { title: "دعوت‌های سخنرانی | میدانِ خیابان" };
export const dynamic = "force-dynamic";

export default async function SpeakerInvitationsPage() {
  // Both boxes are fetched so the tabs render populated on first paint; a guest
  // without a session simply gets empty lists.
  const [received, sent, categories, profile] = await Promise.all([
    getSpeakerInvitations("received").catch(() => []),
    getSpeakerInvitations("sent").catch(() => []),
    getInvitableCategories().catch(() => []),
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
