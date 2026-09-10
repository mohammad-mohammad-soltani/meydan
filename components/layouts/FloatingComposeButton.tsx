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
      className={`
        group
        absolute left-3 z-40
        grid size-14 place-items-center
        overflow-visible
        rounded-full

        border border-brand/20
        bg-brand
        text-brand-foreground

        shadow-floating

        transition-[bottom,transform,box-shadow,filter]
        duration-300
        ease-out

        hover:-translate-y-1
        hover:scale-[1.04]
        hover:shadow-dialog
        hover:brightness-105

        active:translate-y-0
        active:scale-[0.94]

        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-brand/20

        lg:left-5
        lg:size-[3.75rem]

        ${
          currentTrack
            ? "bottom-[calc(11rem+env(safe-area-inset-bottom))] lg:bottom-24"
            : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6"
        }
      `}
    >
      {/* Soft outer glow */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -inset-1.5 -z-10
          rounded-full
          bg-brand/20
          opacity-60
          blur-md
          transition-all
          duration-300
          group-hover:-inset-2
          group-hover:opacity-80
          group-hover:blur-lg
        "
      />

      {/* Subtle inner highlight */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-[2px]
          rounded-full
          border border-white/10
        "
      />

      <PenLine
        className="
          relative z-10
          h-[1.35rem] w-[1.35rem]
          transition-transform
          duration-300
          ease-out
          group-hover:-rotate-6
          group-hover:scale-110
          group-active:rotate-0
          group-active:scale-95
          lg:h-6 lg:w-6
        "
        strokeWidth={2.35}
      />
    </Link>
  );
}