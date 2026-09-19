import type { Metadata } from "next";
import { AdminUsersView } from "@/features/admin/components/AdminUsersView";
import { getUsers, getUserRoles } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";
import type { UserFilters } from "@/features/admin/services/users.service";

export const metadata: Metadata = { title: "رسمی‌ها | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

const OFFICIAL_FILTERS: UserFilters = { q: "", role: "meydan_official", status: "" };

export default async function AdminOfficialsPage() {
  if (!(await isAdministrator())) return null;

  const [initial, roles] = await Promise.all([
    getUsers(OFFICIAL_FILTERS),
    getUserRoles(),
  ]);

  return (
    <AdminUsersView
      initial={initial}
      roles={roles}
      initialFilters={OFFICIAL_FILTERS}
      fixedRole="meydan_official"
      title="رسمی‌ها"
      description="مدیریت حساب‌های رسمی، پروفایل و کانال‌های همگام‌سازی بله و ایتا"
      newHref="/admin/users/new?role=meydan_official"
    />
  );
}
