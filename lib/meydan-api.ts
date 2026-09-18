import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";

const DEFAULT_API_BASE =
  "https://meydanbackend.naghshman.ir/wp-json/meydan/v1";

export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown> & {
    request_id?: string;
    next_cursor?: string | null;
    count?: number;
  };
};

/**
 * A paginated payload: the envelope's `data` plus the cursor that asks the
 * backend for the page after it. `null` means the list is exhausted.
 */
export type ApiPage<T> = {
  data: T;
  nextCursor: string | null;
};

/**
 * The admin lists page with `page`/`per_page` and report `total`/`pages` in
 * `meta` instead of the cursor the public feeds use, so the whole envelope is
 * kept rather than just the payload.
 */
export type ApiEnvelopeResult<T> = {
  data: T;
  meta: Record<string, unknown>;
};

export type MeydanRequestInit = RequestInit & {
  /** Background reads may fail without navigating away from a public page. */
  suppressAuthRedirect?: boolean;
};

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
    fields?: Record<string, string> | null;
  };
  message?: string;
  code?: string;
};

export class MeydanApiError extends Error {
  status: number;
  /** Backend `error.code`, e.g. `validation_failed` or `forbidden`. */
  code?: string;
  /**
   * Per-field reason codes from a WordPress 422 (`{ phone: "taken" }`), which
   * forms turn into inline messages under the matching input.
   */
  fields?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    details?: { code?: string; fields?: Record<string, string> },
  ) {
    super(message);
    this.name = "MeydanApiError";
    this.status = status;
    this.code = details?.code;
    this.fields = details?.fields;
  }
}

/** Reason codes the backend attaches to `error.fields`, mapped to Persian. */
const FIELD_REASON_MESSAGES: Record<string, string> = {
  required: "این فیلد الزامی است.",
  invalid: "مقدار وارد‌شده معتبر نیست.",
  taken: "این مقدار قبلاً ثبت شده است.",
  invalid_or_taken: "این مقدار معتبر نیست یا قبلاً ثبت شده است.",
  not_eligible: "این حساب واجد شرایط نیست.",
  too_long: "مقدار وارد‌شده بیش از حد بلند است.",
};

/**
 * The Persian sentence for a single rejected form field. The server's own
 * message is shown above the form; this explains the marker next to the input.
 */
export function fieldErrorMessage(reason: string): string {
  return FIELD_REASON_MESSAGES[reason] || "مقدار وارد‌شده معتبر نیست.";
}

export function isAuthApiError(reason: unknown): boolean {
  return reason instanceof MeydanApiError && reason.status === 401;
}

export function getMeydanApiBaseUrl(): string {
  if (typeof window !== "undefined") return "/api/meydan";

  return (
    process.env.MEYDAN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
}

export function requiresClientAuthentication(path: string, init?: RequestInit): boolean {
  const method = (init?.method || "GET").toUpperCase();
  const cleanPath = path.split("?")[0] || path;

  if (cleanPath === "/notifications" || cleanPath.startsWith("/notifications/")) {
    return true;
  }
  if (cleanPath === "/push" || cleanPath.startsWith("/push/")) {
    return true;
  }

  if (method === "GET" || method === "HEAD") {
    if (!path.startsWith("/timeline?")) return false;
    const query = path.slice(path.indexOf("?") + 1);
    return new URLSearchParams(query).get("mode") === "following";
  }

  // Sharing and public download analytics should not force a login.
  if (/^\/narratives\/[^/]+\/share$/.test(cleanPath)) return false;
  if (/^\/content\/[^/]+\/(share|files\/[^/]+\/download)$/.test(cleanPath)) return false;

  return (
    cleanPath === "/narratives" ||
    /^\/narratives\/[^/]+\/(like|repost|comments)$/.test(cleanPath) ||
    /^\/actors\/[^/]+\/[^/]+\/follow$/.test(cleanPath) ||
    /^\/initiatives\/[^/]+\/join$/.test(cleanPath) ||
    /^\/content\/[^/]+\/bookmark$/.test(cleanPath) ||
    cleanPath.startsWith("/chat/") ||
    cleanPath === "/chat" ||
    cleanPath.startsWith("/uploads") ||
    cleanPath === "/me" ||
    cleanPath.startsWith("/me/")
  );
}

function redirectClientToLogin(): void {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.assign(loginHref(returnTo));
}

function redirectProtectedClientRequest(path: string, init?: MeydanRequestInit): void {
  if (init?.suppressAuthRedirect) return;
  if (typeof window === "undefined" || !requiresClientAuthentication(path, init)) return;
  if (document.documentElement.dataset.meydanAuthenticated === "true") return;

  redirectClientToLogin();
  throw new MeydanApiError("Authentication required", 401);
}


/**
 * Reads the endpoint and returns the whole envelope, which is what the admin
 * lists need: they page with `page`/`per_page` and report `total` and `pages`
 * in `meta` rather than the `next_cursor` the public feeds use.
 */
export async function meydanApiEnvelope<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelopeResult<T>> {
  const body = await requestEnvelope<T>(path, init);
  const meta =
    "meta" in body && body.meta && typeof body.meta === "object"
      ? (body.meta as Record<string, unknown>)
      : {};
  return { data: (body as ApiEnvelope<T>).data, meta };
}

/**
 * Reads the endpoint and keeps the envelope's pagination cursor, which is what
 * cursor-based feeds (the timeline) need to request the next page. Every other
 * caller only wants the payload and should keep using `meydanApi`.
 */
export async function meydanApiPage<T>(path: string, init?: MeydanRequestInit): Promise<ApiPage<T>> {
  const body = await requestEnvelope<T>(path, init);
  const nextCursor =
    "meta" in body && typeof body.meta?.next_cursor === "string" ? body.meta.next_cursor : null;
  return { data: body.data, nextCursor };
}

export async function meydanApi<T>(path: string, init?: MeydanRequestInit): Promise<T> {
  return (await meydanApiPage<T>(path, init)).data;
}

/**
 * The single fetch/parse/throw path shared by every envelope reader above.
 * Redirect-on-401, the invalid-JSON message and the error text are unchanged
 * from the original single-endpoint implementation; only the structured
 * `error.code`/`error.fields` are new.
 */
async function requestEnvelope<T>(path: string, init?: MeydanRequestInit): Promise<ApiEnvelope<T>> {
  redirectProtectedClientRequest(path, init);

  const base = getMeydanApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const { suppressAuthRedirect, ...requestInit } = init ?? {};
  const response = await fetch(url, {
    ...requestInit,
    cache: init?.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const raw = await response.text();
  let body: ApiEnvelope<T> | ApiErrorBody;

  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    const preview = raw.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new MeydanApiError(
      `Meydan API returned invalid JSON (${response.status})${preview ? `: ${preview}` : ""}`,
      response.status,
    );
  }

  if (!response.ok) {
    if (
      typeof window !== "undefined" &&
      response.status === 401 &&
      !suppressAuthRedirect && requiresClientAuthentication(path, init)
    ) {
      redirectClientToLogin();
    }

    const errorEnvelope = "error" in body ? body.error : undefined;
    const envelopeMessage = errorEnvelope?.message;
    const wordpressMessage =
      "message" in body && typeof body.message === "string" ? body.message : undefined;
    const message =
      envelopeMessage || wordpressMessage || `Meydan API request failed (${response.status})`;
    throw new MeydanApiError(message, response.status, {
      code: errorEnvelope?.code,
      fields:
        errorEnvelope?.fields && typeof errorEnvelope.fields === "object"
          ? errorEnvelope.fields
          : undefined,
    });
  }

  if (!("data" in body)) {
    throw new MeydanApiError("Meydan API response is missing the data envelope.", response.status);
  }

  return body as ApiEnvelope<T>;
}

export function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export function persianDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function compactFa(value: number | string | null | undefined): string {
  const number = Number(value || 0);
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}
