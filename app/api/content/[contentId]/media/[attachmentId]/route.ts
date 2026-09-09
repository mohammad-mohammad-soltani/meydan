import { NextRequest } from "next/server";

type Attachment = { id?: number; url?: string; type?: string };
type ContentResponse = { data?: { attachments?: Attachment[] } };

function apiBase() {
  const value = process.env.MEYDAN_API_BASE_URL || process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL;
  if (!value) throw new Error("MEYDAN_API_BASE_URL is not configured.");
  return value.replace(/\/$/, "");
}

export async function GET(request: NextRequest, context: { params: Promise<{ contentId: string; attachmentId: string }> }) {
  const { contentId, attachmentId } = await context.params;
  const detail = await fetch(`${apiBase()}/content/${encodeURIComponent(contentId)}`, { cache: "no-store" });
  const payload = await detail.json().catch(() => null) as ContentResponse | null;
  const attachment = payload?.data?.attachments?.find((item) => String(item.id) === attachmentId && item.type === "audio");
  if (!detail.ok || !attachment?.url) return new Response("Audio file was not found.", { status: 404 });

  const headers = new Headers({ accept: "audio/*" });
  const range = request.headers.get("range");
  if (range) headers.set("range", range);
  const upstream = await fetch(attachment.url, { headers, cache: "no-store" });
  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("cache-control", "private, max-age=0");
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
