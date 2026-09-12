import type { Metadata } from "next";
import { SpeakerInvitationsView } from "@/features/speaker-invitations/components/SpeakerInvitationsView";
import { getSpeakerInvitations } from "@/features/speaker-invitations/services/speaker-invitations.service";

export const metadata: Metadata = { title: "دعوت‌های سخنرانی | میدانِ خیابان" };
export const dynamic = "force-dynamic";

export default async function SpeakerInvitationsPage() {
  // Both boxes are fetched so the tabs render populated on first paint; a guest
  // without a session simply gets empty lists.
  const [received, sent] = await Promise.all([
    getSpeakerInvitations("received").catch(() => []),
    getSpeakerInvitations("sent").catch(() => []),
  ]);

  return <SpeakerInvitationsView initialReceived={received} initialSent={sent} />;
}
