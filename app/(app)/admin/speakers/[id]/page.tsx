import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSpeakerForm } from "@/features/admin/components/AdminSpeakerForm";
import { getSpeaker } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ویرایش سخنران | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminSpeakerDetailPage({ params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const speaker = await getSpeaker(id);
  if (!speaker) notFound();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={speaker.name || `سخنران #${speaker.userId}`}
        description="ویرایش پروفایل یا حذف نقش سخنران."
        crumbs={[{ label: "سخنرانان", href: "/admin/speakers" }, { label: speaker.name || `#${speaker.userId}` }]}
      />
      <AdminSpeakerForm mode="edit" speaker={speaker} />
    </div>
  );
}
