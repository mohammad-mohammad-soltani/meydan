"use client";

import { MeydanApiError, meydanApi } from "@/lib/meydan-api";

/**
 * `GET /me/shell`: the viewer, badge counters, realtime and push settings in
 * one request. Every page load used to make six separate requests for these.
 * Each consumer still has its own endpoint as a fallback, so an older backend
 * without `/me/shell` keeps working.
 */
export type Shell = {
  me: Record<string, unknown> | null;
  unread: { messages: number; notifications: number };
  realtime: Record<string, unknown>;
  push: { provider?: string; enabled?: boolean; vapid_public_key?: string | null };
};

let pending: Promise<Shell | null> | null = null;
/** Set once the backend answered 404: stop asking on this page. */
let unsupported = false;

export function getShell(): Promise<Shell | null> {
  if (unsupported) return Promise.resolve(null);
  pending ??= meydanApi<Shell>("/me/shell", { suppressAuthRedirect: true }).catch((reason: unknown) => {
    if (reason instanceof MeydanApiError && (reason.status === 404 || reason.status === 405)) unsupported = true;
    // Any failure: the callers fall back to their own endpoints; a later call may try again.
    pending = null;
    return null;
  });
  return pending;
}

/** The next read fetches a fresh shell (after a profile edit, login or logout). */
export function invalidateShell(): void {
  pending = null;
}
