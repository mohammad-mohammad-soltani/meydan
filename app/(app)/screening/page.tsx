import type { Metadata } from "next";
import { ScreeningView } from "@/features/coming-soon/ScreeningView";

export const metadata: Metadata = { title: "ثبت‌نام اکران | نقش من" };

export default function ScreeningPage() {
  return <ScreeningView />;
}
