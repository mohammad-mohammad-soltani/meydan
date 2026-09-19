import type { Metadata } from "next";
import { AdminUserForm } from "@/features/admin/components/AdminUserForm";
import { getUserRoles } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "افزودن کاربر | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";
export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (!(await isAdministrator())) return null;
  const requestedRole = (await searchParams).role;
  const initialRole = requestedRole === "meydan_official" ? "meydan_official" : undefined;
  return <AdminUserForm roles={await getUserRoles()} initialRole={initialRole} />;
}
