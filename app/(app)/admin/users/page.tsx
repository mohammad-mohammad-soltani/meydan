import type { Metadata } from "next";
import { AdminUsersView } from "@/features/admin/components/AdminUsersView";
import { getUsers, getUserRoles } from "@/features/admin/services/admin-server";
import { EMPTY_USER_FILTERS } from "@/features/admin/services/users.service";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "کاربران | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (!(await isAdministrator())) return null;
  const [initial, roles] = await Promise.all([getUsers(EMPTY_USER_FILTERS), getUserRoles()]);
  return <AdminUsersView initial={initial} roles={roles} />;
}
