import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminParticipantsView } from "@/features/admin/components/AdminParticipantsView";
import { getParticipants, getProgram } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "شرکت‌کنندگان ابتکار | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminParticipantsPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  // The participant route needs the initiative for its title and count, so a
  // missing initiative is a 404 here rather than an empty table.
  const [initiative, participants] = await Promise.all([
    getProgram("initiatives", id),
    getParticipants(id),
  ]);
  if (!initiative) notFound();

  return <AdminParticipantsView initiative={initiative} initial={participants} />;
}
