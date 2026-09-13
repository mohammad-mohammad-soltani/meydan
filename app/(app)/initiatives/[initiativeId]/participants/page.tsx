import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParticipantsView } from "@/features/initiatives/components/ParticipantsView";
import { getInitiativeParticipants } from "@/features/initiatives/services/initiatives.service";

export const metadata: Metadata = { title: "افراد پیوسته به کار خوب | نقش من" };
export const dynamic = "force-dynamic";

type ParticipantsPageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default async function InitiativeParticipantsPage({ params }: ParticipantsPageProps) {
  const { initiativeId } = await params;
  const result = await getInitiativeParticipants(initiativeId);

  if (!result) notFound();

  return (
    <ParticipantsView
      participants={result.items}
      participantCount={result.participantCount}
    />
  );
}
