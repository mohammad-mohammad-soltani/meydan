"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudio } from "@/features/audio/AudioProvider";
import { useAuthGate } from "@/components/providers/AuthGateProvider";

/**
 * Mobile-only compose call to action. From `lg` up the desktop sidebar owns the
 * primary compose action (`SidebarComposeButton`), so this floating button hides
 * itself there instead of competing with it.
 */
export function FloatingComposeButton() {
  const pathname = usePathname();
  const { currentTrack } = useAudio();
  const { requireAuth } = useAuthGate();

  const isVisible = pathname === "/home" || pathname === "/profile";

  if (!isVisible) return null;

  return (
    <Link
      href="/compose"
      onClick={(event) => {
        if (!requireAuth("/compose")) event.preventDefault();
      }}
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

        lg:hidden

        ${
          currentTrack
            ? "bottom-[calc(11rem+env(safe-area-inset-bottom))]"
            : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
        }
      `}
    >
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
        "
        strokeWidth={2.35}
      />
    </Link>
  );
}
