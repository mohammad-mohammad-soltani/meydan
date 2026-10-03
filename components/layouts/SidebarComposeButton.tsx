"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";

/**
 * Desktop primary action: the X-style "post" pill that closes the sidebar nav.
 *
 * `AppShell` renders it only for authenticated viewers, so it never has to gate
 * on the auth context itself. The mobile equivalent is `FloatingComposeButton`,
 * which is hidden from `lg` up to keep exactly one primary compose action per
 * breakpoint.
 */
export function SidebarComposeButton() {
  return (
    <Link
      href="/compose"
      title="نوشتن روایت تازه"
      className="
        group flex min-h-12 w-full items-center justify-center gap-2.5
        rounded-pill bg-brand px-5
        text-base font-black text-brand-foreground
        shadow-xs
        outline-none

        transition-[background-color,box-shadow,transform]
        duration-200
        ease-out

        hover:bg-brand-hover hover:shadow-card

        active:scale-[0.98] active:bg-brand-active

        focus-visible:ring-2 focus-visible:ring-ring
      "
    >
      <PenLine
        aria-hidden="true"
        strokeWidth={2.35}
        className="h-5 w-5 transition-transform duration-200 ease-out group-hover:-rotate-6"
      />
      نوشتن
    </Link>
  );
}
