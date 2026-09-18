import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminUserForm } from "@/features/admin/components/AdminUserForm";
import { getUser, getUserRoles } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";
import { isNotFound } from "@/features/admin/services/admin-api";

export const metadata: Metadata = { title: "ویرایش کاربر | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";
export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  if (!(await isAdministrator())) return null;
  const { id } = await params;
  let user;
  try { user = await getUser(id); } catch (reason) { if (isNotFound(reason)) notFound(); throw reason; }
  return <AdminUserForm key={user.id} user={user} roles={await getUserRoles()} created={(await searchParams).created === "1"} />;
}
