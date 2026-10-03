import type { Metadata } from "next";
import { SpeakerSignupView } from "@/features/coming-soon/SpeakerSignupView";
import { getSpeakerCategories } from "@/features/speakers/services/speakers.service";

export const metadata: Metadata = { title: "ثبت‌نام سخنران | نقش من" };
export const dynamic = "force-dynamic";

export default async function SpeakerSignupPage() {
  const categories = await getSpeakerCategories().catch(() => []);
  return <SpeakerSignupView categories={categories} />;
}
