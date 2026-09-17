import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AdminForbidden,
  AdminGateError,
} from "@/features/admin/components/AdminForbidden";
import { AdminSectionNav } from "@/features/admin/components/AdminSectionNav";
import { resolveAdminGate } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = {
  title: "پنل مدیریت میدان",
  robots: { index: false, follow: false },
};

// The role is decided per request from the API, never cached across visitors.
export const dynamic = "force-dynamic";

/**
 * The admin gate, and the screen a denied visitor sees.
 *
 * `proxy.ts` only checks that a session cookie exists; the role check needs the
 * API, so this server layout reads `/me` and fails closed. The decision itself
 * lives in `resolveAdminGate` (see there for the four outcomes); this component
 * only turns the verdict into a screen, outside the `try` that produced it.
 *
 * Every page in this subtree re-checks the same predicate before running any
 * query, because Next evaluates a nested page segment even when a layout renders
 * something other than `{children}`.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const gate = await resolveAdminGate();

  if (gate.status === "denied") {
    return <AdminForbidden role={gate.role} />;
  }

  if (gate.status === "unavailable") {
    return (
      <AdminGateError message="ارتباط با سرور برای بررسی نقش شما برقرار نشد." />
    );
  }

  return (
    <div className="admin-shell min-h-full bg-background text-foreground">
      <AdminSectionNav />
      <main className="lg:mr-72">{children}</main>
    </div>
  );
}
