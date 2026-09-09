"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatingComposeButton() {
  const pathname = usePathname();

  if (pathname !== "/home") return null;

  return (
    <Link
      href="/compose"
      aria-label="نوشتن روایت تازه"
      title="نوشتن روایت"
      className="absolute bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-floating transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-dialog active:scale-90 lg:hidden"
    >
      <PenLine className="h-6 w-6" strokeWidth={2.2} />
    </Link>
  );
}
