"use client";

import { useRouter } from "next/navigation";

/**
 * A stable `router.refresh()` for admin client views.
 *
 * It lives in its own hook rather than inside a view because a refresh is needed
 * by components that own no server data of their own — a create form that wants
 * the list behind it to re-render, for example.
 */
export function useAdminRefresh(): () => void {
  const router = useRouter();
  return () => router.refresh();
}
