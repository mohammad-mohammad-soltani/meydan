"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudio } from "@/features/audio/AudioProvider";

export function FloatingComposeButton() {
  const pathname = usePathname();
  const { currentTrack } = useAudio();
  const isVisible = pathname === "/home" || pathname === "/profile";

  if (!isVisible) return null;

  return (
    <Link
      href="/compose"
      aria-label="نوشتن روایت تازه"
      title="نوشتن روایت"
      className={`absolute left-2 z-40 grid size-14 place-items-center rounded-full border border-border bg-brand/10 text-brand-foreground shadow-floating backdrop-blur-lg backdrop-brightness-80 transition-[bottom,transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-dialog active:scale-90 lg:left-4 ${
        currentTrack
          ? "bottom-[calc(11rem+env(safe-area-inset-bottom))] lg:bottom-24"
          : "bottom-[calc(4.45rem+env(safe-area-inset-bottom))] lg:bottom-6"
      }`}
    >
      <PenLine className="h-6 w-6" strokeWidth={2.2} />
    </Link>
  );
}
