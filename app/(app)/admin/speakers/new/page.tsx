import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSpeakerForm } from "@/features/admin/components/AdminSpeakerForm";
import { getLinkableUsers } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ارتقای کاربر به سخنران | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSpeakerCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  // Only accounts that may actually be promoted; the backend filters out
  // administrators, square accounts and existing speakers.
  const users = await getLinkableUsers();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="ارتقای کاربر به سخنران"
        description="یک حساب موجود را انتخاب و پروفایل سخنران را تکمیل کنید. ارتقا تکرارپذیر است."
        crumbs={[{ label: "سخنرانان", href: "/admin/speakers" }, { label: "ارتقا" }]}
      />
      <AdminSpeakerForm mode="create" users={users} />
    </div>
  );
}
