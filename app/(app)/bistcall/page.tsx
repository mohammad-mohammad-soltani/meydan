import type { Metadata } from "next";
import { BistCallView } from "@/features/coming-soon/BistCallView";

export const metadata: Metadata = { title: "بیست‌کال | نقش من" };

export default function BistCallPage() {
  return <BistCallView />;
}
