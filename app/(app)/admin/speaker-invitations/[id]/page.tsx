import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSpeakerRequestDetailView } from "@/features/admin/components/AdminSpeakerRequestDetailView";
import { getSpeakerInvitation } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "جزئیات دعوت‌نامه | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminSpeakerInvitationDetailPage({ params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const request = await getSpeakerInvitation(id);
  if (!request) notFound();

  return <AdminSpeakerRequestDetailView surface="speaker-invitations" request={request} />;
}
