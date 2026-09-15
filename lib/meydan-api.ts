import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";

const DEFAULT_API_BASE =
  "https://meydanbackend.naghshman.ir/wp-json/meydan/v1";

export type ApiEnvelope<T> = {
  data: T;
  meta?: { request_id?: string; next_cursor?: string | null };
};

type ApiErrorBody = {
  error?: { message?: string };
  message?: string;
  code?: string;
};

export class MeydanApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MeydanApiError";
    this.status = status;
  }
}

export function isAuthApiError(reason: unknown): boolean {
  return reason instanceof MeydanApiError && (reason.status === 401 || reason.status === 403);
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

function redirectProtectedClientRequest(path: string, init?: RequestInit): void {
  if (typeof window === "undefined" || !requiresClientAuthentication(path, init)) return;
  if (document.documentElement.dataset.meydanAuthenticated === "true") return;

  redirectClientToLogin();
  throw new MeydanApiError("Authentication required", 401);
}

export async function meydanApi<T>(path: string, init?: RequestInit): Promise<T> {
  redirectProtectedClientRequest(path, init);

  const base = getMeydanApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
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
      (response.status === 401 || response.status === 403) &&
      requiresClientAuthentication(path, init)
    ) {
      redirectClientToLogin();
    }

    const envelopeMessage =
      "error" in body && body.error?.message ? body.error.message : undefined;
    const wordpressMessage =
      "message" in body && typeof body.message === "string" ? body.message : undefined;
    const message =
      envelopeMessage || wordpressMessage || `Meydan API request failed (${response.status})`;
    throw new MeydanApiError(message, response.status);
  }

  if (!("data" in body)) {
    throw new MeydanApiError("Meydan API response is missing the data envelope.", response.status);
  }

  return body.data;
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
