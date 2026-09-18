import {
  MeydanApiError,
  meydanApi,
  meydanApiEnvelope,
  type ApiEnvelopeResult,
} from "@/lib/meydan-api";

/**
 * The transport every admin service funnels through.
 *
 * These functions carry no credentials of their own. A server-rendered admin
 * page reaches the API origin directly and must send the session token, while
 * the browser reaches it through `app/api/meydan/[...path]`, which injects the
 * token from the httpOnly cookie. `withAdminAuth` in `./admin-request` supplies
 * that header on the server, and the `init` parameters here are how it gets in.
 *
 * Two backend behaviours shape this file:
 *
 * 1. Admin POSTs are cached by `idempotency-key` for 24 hours and the cache
 *    replays the *whole* response — a 4xx included. A key reused across two
 *    different submissions therefore replays the first failure forever, so a
 *    fresh key is minted per submit and only for non-idempotent verbs.
 * 2. The `/admin/*` permission callback returns a raw `WP_Error`, which
 *    WordPress serializes as `{ code, message, data: { status } }` rather than
 *    the `{ error: { code, message, fields } }` envelope the controllers use.
 *    `MeydanApiError` normalizes both, and `adminErrorMessage` gives every
 *    screen one Persian sentence to show.
 *
 * Keep this module clear of `next/headers`, directly or through an import
 * chain: `MediaPickerField` is a client component and imports
 * `adminErrorMessage` from here.
 */

function newIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  // Older Safari (and any non-secure context) has no randomUUID; the key only
  // has to be unique per submit, not cryptographically strong.
  return `admin-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Builds the JSON request init shared by every mutating admin call. */
function jsonInit(
  method: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): RequestInit {
  const idempotent = method === "POST" || method === "PATCH" || method === "DELETE";
  return {
    method,
    headers: {
      "content-type": "application/json",
      ...(idempotent ? { "idempotency-key": newIdempotencyKey() } : {}),
      ...(extraHeaders || {}),
    },
    body: JSON.stringify(body ?? {}),
  };
}

/** `GET` that also returns `meta`, for the paged lists. */
export function adminGetEnvelope<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelopeResult<T>> {
  return meydanApiEnvelope<T>(path, init);
}

export async function adminGetList<T>(path: string, init?: RequestInit): Promise<T> {
  return meydanApi<T>(path, init);
}

export async function adminGetItem<T>(path: string, init?: RequestInit): Promise<T> {
  return meydanApi<T>(path, init);
}

export async function adminPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return meydanApi<T>(path, mergeInit(jsonInit("POST", body), init));
}

export async function adminPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return meydanApi<T>(path, mergeInit(jsonInit("PATCH", body), init));
}

export async function adminPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return meydanApi<T>(path, mergeInit(jsonInit("PUT", body), init));
}

/**
 * DELETE with an optional body. The narrative-content removal and the square
 * status routes are DELETEs that still need a payload.
 */
export async function adminDelete<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const request: RequestInit =
    body === undefined
      ? { method: "DELETE", headers: { "idempotency-key": newIdempotencyKey() } }
      : jsonInit("DELETE", body);
  return meydanApi<T>(path, mergeInit(request, init));
}

/**
 * Merges a caller's request options over a built one, joining the headers.
 *
 * Spreading `...init` alone would drop the `content-type` and idempotency key
 * this module just built, so headers are merged explicitly and the caller's
 * values win.
 */
function mergeInit(base: RequestInit, extra?: RequestInit): RequestInit {
  if (!extra) return base;
  return {
    ...base,
    ...extra,
    headers: {
      ...((base.headers as Record<string, string> | undefined) || {}),
      ...((extra.headers as Record<string, string> | undefined) || {}),
    },
  };
}

/** Percent-encodes a path segment (ids are numeric, but this keeps callers safe). */
export function segment(value: string | number): string {
  return encodeURIComponent(String(value));
}

/** Serializes a filter record into a query string, dropping empty values. */
export function query(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/**
 * True when the failure is a missing record, so a detail page can call
 * `notFound()` instead of rendering the error boundary.
 */
export function isNotFound(reason: unknown): boolean {
  return reason instanceof MeydanApiError && reason.status === 404;
}

/** True for an explicit 403 — the viewer is signed in but not an administrator. */
export function isForbidden(reason: unknown): boolean {
  return reason instanceof MeydanApiError && reason.status === 403;
}

/**
 * The one sentence an admin screen shows when an operation fails. The backend
 * always sends a Persian `error.message`, so that wins; these are the fallbacks
 * for transport failures and non-JSON responses.
 */
export function adminErrorMessage(
  reason: unknown,
  fallback = "انجام این عملیات ممکن نشد.",
): string {
  if (reason instanceof MeydanApiError) {
    if (reason.status === 401) return "نشست شما منقضی شده است؛ دوباره وارد شوید.";
    if (reason.status === 403) return "اجازه‌ی انجام این عملیات را ندارید.";
    if (reason.status === 404) return "این مورد پیدا نشد.";
    if (reason.status === 429) return "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.";
    if (reason.status >= 500) return "خطای سرور؛ لطفاً دوباره تلاش کنید.";
    if (reason.message && !/^Meydan API/i.test(reason.message)) return reason.message;
  }

  return fallback;
}

/**
 * Number of pages the backend reported, tolerating `total_pages` (the
 * narrative editorial list) as well as `pages` (the square list).
 */
export function metaInt(meta: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = Number(meta[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}
