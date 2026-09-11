import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/meydan-session";

type Attachment = { id?: number; url?: string; type?: string };
type ContentResponse = { data?: { attachments?: Attachment[] } };

const DEFAULT_API_BASE = "https://meydan-api.nabzjahan.ir/wp-json/meydan/v1";
const GUEST_COOKIE = "meydan_guest";

function apiBase() {
  return (
    process.env.MEYDAN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
}

function cookieFromSetCookie(response: Response, name: string): string | undefined {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`))?.[1];
}

function copyAudioResponseHeaders(upstream: Response) {
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
    (item) => String(item.id) === attachmentId && item.type === "audio",
  );

  if (!detail.ok || !attachment?.url) {
    return new Response("Audio file was not found.", { status: 404 });
  }

  let mediaUrl: URL;
  try {
    mediaUrl = new URL(attachment.url);
  } catch {
    return new Response("Audio file URL is invalid.", { status: 502 });
  }

  // Only proxy media hosted by the configured Meydan backend. This keeps the
  // route from becoming an open proxy if malformed content data is returned.
  if (mediaUrl.origin !== apiOrigin) {
    return new Response("Audio file host is not allowed.", { status: 502 });
  }

  const upstreamHeaders = new Headers({
    accept: request.headers.get("accept") || "audio/*,*/*;q=0.8",
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

  const upstream = await fetch(mediaUrl, {
    headers: upstreamHeaders,
    cache: "no-store",
    redirect: "follow",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: copyAudioResponseHeaders(upstream),
  });
}
