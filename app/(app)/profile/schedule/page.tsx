import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ScheduleView } from "@/features/profile/components/ScheduleView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { loginHref } from "@/lib/auth-navigation";

export const metadata: Metadata = { title: "سین برنامه | نقش من" };
export const dynamic = "force-dynamic";

export default async function SquareSchedulePage() {
  const profile = await getProfileDetails().catch(() => null);
  if (!profile) redirect(loginHref("/profile/schedule"));

  // Only a square account owns a programme board.
  if (profile.accountType !== "square" || (profile.kind ?? "square") !== "square") redirect("/profile");

  return <ScheduleView initialItems={profile.schedule} squareName={profile.identity.name} />;
}
