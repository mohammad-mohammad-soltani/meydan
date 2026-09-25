import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/meydan-session";

type Attachment = { id?: number; url?: string; type?: string };
type ContentResponse = { data?: { attachments?: Attachment[] } };

const DEFAULT_API_BASE = "https://meydanbackend.naghshman.ir/wp-json/meydan/v1";
const GUEST_COOKIE = "meydan_guest";
const ARVAN_MEDIA_HOST = "naghshman-media.s3.ir-thr-at1.arvanstorage.ir";
const TRUSTED_MEDIA_DOMAIN_SUFFIXES = ["naghshman.ir", "nabzjahan.ir"];

function apiBase() {
  return (
    process.env.MEYDAN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
}

function configuredMediaOrigins(): Set<string> {
  const origins = new Set<string>();

  for (const value of (process.env.MEYDAN_MEDIA_ALLOWED_ORIGINS || "").split(",")) {
    try {
      const url = new URL(value.trim());
      if (url.protocol === "https:" || url.protocol === "http:") origins.add(url.origin);
    } catch {
      // Ignore malformed optional configuration instead of trusting it.
    }
  }

  return origins;
}

function isTrustedMediaUrl(mediaUrl: URL, apiOrigin: string): boolean {
  if (mediaUrl.protocol !== "https:" && mediaUrl.protocol !== "http:") return false;
  if (mediaUrl.origin === apiOrigin || configuredMediaOrigins().has(mediaUrl.origin)) return true;
  if (mediaUrl.hostname === ARVAN_MEDIA_HOST) return true;

  return TRUSTED_MEDIA_DOMAIN_SUFFIXES.some(
    (domain) => mediaUrl.hostname === domain || mediaUrl.hostname.endsWith(`.${domain}`),
  );
}

async function fetchTrustedMedia(url: URL, headers: Headers, apiOrigin: string): Promise<Response> {
  let current = url;

  // Storage/CDN URLs may redirect to a signed object URL. Follow only redirects
  // that remain on a configured Meydan media host; never turn this endpoint into
  // an open proxy.
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const response = await fetch(current, {
      headers,
      cache: "no-store",
      redirect: "manual",
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return new Response("Media redirect URL is invalid.", { status: 502 });
    }

    if (!isTrustedMediaUrl(next, apiOrigin)) {
      return new Response("Media redirect host is not allowed.", { status: 502 });
    }

    current = next;
  }

  return new Response("Too many media redirects.", { status: 508 });
}

function cookieFromSetCookie(response: Response, name: string): string | undefined {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`))?.[1];
}

function copyMediaResponseHeaders(upstream: Response) {
  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "private, max-age=0, no-store");
  return headers;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contentId: string; attachmentId: string }> },
) {
  const { contentId, attachmentId } = await context.params;
  const base = apiBase();
  const apiOrigin = new URL(base).origin;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const existingGuest = request.cookies.get(GUEST_COOKIE)?.value;

  const detailHeaders = new Headers({ accept: "application/json" });
  if (accessToken) detailHeaders.set("authorization", `Bearer ${accessToken}`);
  if (existingGuest) detailHeaders.set("cookie", `${GUEST_COOKIE}=${existingGuest}`);

  const detail = await fetch(`${base}/content/${encodeURIComponent(contentId)}`, {
    headers: detailHeaders,
    cache: "no-store",
  });
  const payload = (await detail.json().catch(() => null)) as ContentResponse | null;
  const attachment = payload?.data?.attachments?.find(
    (item) =>
      String(item.id) === attachmentId && (item.type === "audio" || item.type === "video"),
  );

  if (!detail.ok || !attachment?.url) {
    return new Response("Media attachment was not found.", { status: 404 });
  }

  let mediaUrl: URL;
  try {
    mediaUrl = new URL(attachment.url);
  } catch {
    return new Response("Media attachment URL is invalid.", { status: 502 });
  }

  // The attachment is verified against its content record first. Its origin is
  // then limited to our API, known deployment domains, the object-storage host,
  // or explicit deployment configuration. This covers legacy narrative uploads
  // that were published under a different Meydan hostname.
  if (!isTrustedMediaUrl(mediaUrl, apiOrigin)) {
    return new Response("Media host is not allowed.", { status: 502 });
  }

  const upstreamHeaders = new Headers({
    accept: request.headers.get("accept") || "audio/*,video/*,*/*;q=0.8",
    "accept-encoding": "identity",
    referer: `${apiOrigin}/`,
  });

  const userAgent = request.headers.get("user-agent");
  if (userAgent) upstreamHeaders.set("user-agent", userAgent);

  const range = request.headers.get("range");
  const ifRange = request.headers.get("if-range");
  if (range) upstreamHeaders.set("range", range);
  if (ifRange) upstreamHeaders.set("if-range", ifRange);
  if (accessToken) upstreamHeaders.set("authorization", `Bearer ${accessToken}`);

  const guest = existingGuest || cookieFromSetCookie(detail, GUEST_COOKIE);
  if (guest) upstreamHeaders.set("cookie", `${GUEST_COOKIE}=${guest}`);

  const upstream = await fetchTrustedMedia(mediaUrl, upstreamHeaders, apiOrigin);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: copyMediaResponseHeaders(upstream),
  });
}
