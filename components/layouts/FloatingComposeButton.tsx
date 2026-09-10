"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudio } from "@/features/audio/AudioProvider";

export function FloatingComposeButton() {
  const pathname = usePathname();
  const { currentTrack } = useAudio();

  if (pathname !== "/home") return null;

  return (
    <Link
      href="/compose"
      aria-label="نوشتن روایت تازه"
      title="نوشتن روایت"
      className={`absolute left-2 z-40 grid size-14 place-items-center rounded-full bg-brand/10 backdrop-brightness-80 backdrop-blur-lg border-border text-brand-foreground shadow-floating transition-[bottom,transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-dialog active:scale-90 lg:hidden ${
        currentTrack
          ? "bottom-[calc(11rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(4.45rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <PenLine className="aspect-square w-full" strokeWidth={2.2} />
    </Link>
  );
}
