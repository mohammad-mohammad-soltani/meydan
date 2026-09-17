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
}: {
  isAuthenticated: boolean;
  className: string;
}) {
  const viewer = useViewerRole(isAuthenticated);

  if (!viewer.isAdministrator) return null;

  return (
    <Link href={"/admin" as Route} className={className}>
      <ShieldCheck className="h-5 w-5" />
      پنل مدیریت
    </Link>
  );
}
