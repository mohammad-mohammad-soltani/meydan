"use client";

import Link from "next/link";
import type { Route } from "next";
import { ShieldCheck } from "lucide-react";
import { useViewerRole } from "@/features/auth/hooks/useViewerRole";

/**
 * The desktop-only «پنل مدیریت» entry point.
 *
 * It renders nothing until `/me` has answered and confirmed the
 * `administrator` role, so a non-admin never sees the link — the server-side
 * gate in `app/(app)/admin/layout.tsx` is what actually enforces access. The
 * bottom navigation is intentionally left alone: it is a fixed `grid-cols-5`
 * layout and adding a sixth item would reflow every tab.
 */
export function AdminNavLink({
  isAuthenticated,
  className,
  iconOnly = false,
  "aria-current": ariaCurrent,
}: {
  isAuthenticated: boolean;
  className: string;
  /** Just the shield, for tight toolbars; the name stays available to screen readers. */
  iconOnly?: boolean;
  "aria-current"?: "page";
}) {
  const viewer = useViewerRole(isAuthenticated);

  if (!viewer.isAdministrator) return null;

  return (
    <Link href={"/admin" as Route} className={className} aria-current={ariaCurrent} aria-label={iconOnly ? "پنل مدیریت" : undefined} title={iconOnly ? "پنل مدیریت" : undefined}>
      <ShieldCheck className={iconOnly ? "h-[18px] w-[18px] shrink-0" : "h-[22px] w-[22px] shrink-0 stroke-[1.8]"} />
      {iconOnly ? null : <span data-nav-label>پنل مدیریت</span>}
    </Link>
  );
}
