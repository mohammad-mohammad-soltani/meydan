import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSpeakerForm } from "@/features/admin/components/AdminSpeakerForm";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "افزودن سخنران | مدیریت میدان",
};

/** The route is deliberately separate from promotion so an existing account is never selected by mistake. */
export default async function NewSpeakerAccountPage() {
  if (!(await isAdministrator())) return null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="افزودن سخنران"
        description="حساب کاربری و تنظیمات اختصاصی سخنران را یک‌جا بسازید. ورود عادی حساب از مسیر پیامکی انجام می‌شود."
        crumbs={[{ label: "سخنرانان", href: "/admin/speakers" }, { label: "افزودن سخنران" }]}
      />
      <AdminSpeakerForm mode="new-account" />
    </div>
  );
}
