import type { MediaReflection, MediaReflectionInput, Narrative } from "../types";
import {
  adminDelete,
  adminErrorMessage,
  adminGetItem,
  adminPatch,
  adminPost,
  adminPut,
  isNotFound,
  query,
  segment,
} from "./admin-api";

export { adminErrorMessage, isNotFound };

/* ------------------------------------------------------------------- wire */

type ApiAttachment = {
  media_id?: number | null;
  url?: string | null;
  type?: string | null;
  order?: number | null;
};

type ApiNarrative = {
  id: number;
  body?: string | null;
  status?: string | null;
  published_at?: string | null;
  author?: {
    id?: string | null;
    type?: string | null;
    display_name?: string | null;
  } | null;
  attachments?: ApiAttachment[] | null;
  tags?: string[] | null;
  editorial?: boolean | null;
  is_content?: boolean | null;
  content_id?: number | null;
  media_reflections?: ApiReflection[] | null;
};

type ApiReflection = {
  id: number;
  narrative_id?: number | null;
  outlet?: string | null;
  outlet_id?: number | null;
  outlet_detail?: { id?: number; name?: string | null } | null;
  title?: string | null;
  summary?: string | null;
  url?: string | null;
  logo_url?: string | null;
  published_at?: string | null;
  status?: string | null;
  position?: number | null;
};

function firstLine(body: string): string {
  const line = body.split(/\r?\n/).find((item) => item.trim() !== "");
  return (line ?? "").trim().slice(0, 120);
}

export function mapNarrative(row: ApiNarrative): Narrative {
  const body = String(row.body ?? "");
  return {
    id: Number(row.id),
    body,
    title: firstLine(body) || `روایت #${row.id}`,
    authorName: String(row.author?.display_name ?? ""),
    authorType: String(row.author?.type ?? ""),
    authorId: String(row.author?.id ?? ""),
    editorial: Boolean(row.editorial),
    contentId: row.content_id ? Number(row.content_id) : null,
    createdAt: row.published_at ? String(row.published_at) : null,
    attachments: (row.attachments ?? [])
      .filter((item) => Number(item?.media_id ?? 0) > 0)
      .map((item) => ({
        mediaId: Number(item.media_id),
        url: String(item.url ?? ""),
        type: String(item.type ?? ""),
      })),
  };
}

export function mapReflection(row: ApiReflection): MediaReflection {
  return {
    id: Number(row.id),
    narrativeId: Number(row.narrative_id ?? 0),
    outletId: Number(row.outlet_id ?? 0),
    // `outlet_detail` is the joined outlet; the plain `outlet` column is a
    // free-text fallback for reflections recorded without an outlet record.
    outletName: String(row.outlet_detail?.name ?? row.outlet ?? ""),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    url: String(row.url ?? ""),
    logoUrl: row.logo_url || null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    status: String(row.status ?? "published"),
    position: Number(row.position ?? 0),
  };
}

/* ------------------------------------------------------------------- reads */

/** `GET /editorial/narratives` pages with `page`/`limit` and reports `total_pages`. */
export type EditorialPage = {
  items: Narrative[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export async function getEditorialNarratives(
  page = 1,
  limit = 20,
  init?: RequestInit,
): Promise<EditorialPage> {
  const payload = await adminGetItem<{
    items?: ApiNarrative[] | null;
    page?: number | null;
    per_page?: number | null;
    total?: number | null;
    total_pages?: number | null;
  }>(`/editorial/narratives${query({ page, limit })}`, init);

  return {
    items: (payload?.items ?? []).map(mapNarrative),
    page: Number(payload?.page ?? page),
    perPage: Number(payload?.per_page ?? limit),
    total: Number(payload?.total ?? 0),
    totalPages: Number(payload?.total_pages ?? 1),
  };
}

export async function getNarrative(id: string, init?: RequestInit): Promise<Narrative | null> {
  try {
    return mapNarrative(await adminGetItem<ApiNarrative>(`/narratives/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

/**
 * The admin has no narrative list endpoint, so a narrative is found by id or
 * through the public search. Only narratives are asked for.
 */
export async function searchNarratives(q: string, init?: RequestInit): Promise<Narrative[]> {
  const term = q.trim();
  if (!term) return [];

  const payload = await adminGetItem<{
    narratives?: Array<{ id?: number; body?: string; author?: ApiNarrative["author"]; published_at?: string | null }>;
  }>(`/explore/search${query({ q: term, types: "narrative" })}`, init);

  return (payload?.narratives ?? [])
    .filter((row): row is { id: number } => Number(row?.id) > 0)
    .map((row) => mapNarrative(row as ApiNarrative));
}

export async function getMediaReflections(narrativeId: string, init?: RequestInit): Promise<MediaReflection[]> {
  const rows = await adminGetItem<ApiReflection[]>(
    `/narratives/${segment(narrativeId)}/media-reflections`,
    init,
  );
  return (rows ?? []).map(mapReflection);
}

/* ------------------------------------------------------------------ writes */

/**
 * Editorial marking has only the administrator gate — no capability check
 * beyond the `/admin/` prefix — and both verbs are idempotent.
 */
export async function setEditorial(id: string, editorial: boolean, init?: RequestInit): Promise<void> {
  const path = `/admin/narratives/${segment(id)}/editorial`;
  if (editorial) await adminPut<{ id: number; editorial: boolean }>(path, init);
  else await adminDelete<{ id: number; editorial: boolean }>(path, init);
}

/**
 * Converts a narrative into a content item. Idempotent: a second call returns
 * the row created by the first, so no duplicate content is produced.
 * `content_type` is required and must be one of the five canonical content types.
 */
export async function convertNarrativeToContent(id: string, contentType: string, format: string, primaryAttachmentId?: number | null, extra: { category?: string; featured?: boolean; title?: string } = {}, init?: RequestInit): Promise<void> {
  await adminPost(`/admin/narratives/${segment(id)}/content`, { content_type: contentType, format, ...(primaryAttachmentId ? { primary_attachment_id: primaryAttachmentId } : {}), ...(extra.category ? { category: extra.category } : {}), featured: Boolean(extra.featured), ...(extra.title ? { title: extra.title } : {}) }, init);
}

/**
 * Removes the narrative→content link and trashes the content. Not idempotent:
 * a second call answers 404 (`not_found`), which the caller treats as success.
 */
export async function removeNarrativeContent(id: string, init?: RequestInit): Promise<void> {
  try {
    await adminDelete(`/admin/narratives/${segment(id)}/content`, init);
  } catch (reason) {
    if (!isNotFound(reason)) throw reason;
  }
}

export function reflectionBody(input: MediaReflectionInput): Record<string, unknown> {
  return {
    // `outlet_id` (a real outlet post) wins over the free-text `outlet`; the
    // backend overwrites the name from the post title when an id is present.
    ...(input.outletId ? { outlet_id: input.outletId } : {}),
    outlet: input.outlet.trim(),
    title: input.title.trim(),
    url: input.url.trim(),
    summary: input.summary,
    logo_media_id: input.logoMediaId ?? 0,
    published_at: input.publishedAt,
    status: input.status,
    position: input.position,
  };
}

export async function createMediaReflection(
  narrativeId: string,
  input: MediaReflectionInput,
  init?: RequestInit,
): Promise<void> {
  await adminPost(`/admin/narratives/${segment(narrativeId)}/media-reflections`, reflectionBody(input), init);
}

export async function updateMediaReflection(
  id: number,
  input: MediaReflectionInput,
  init?: RequestInit,
): Promise<void> {
  await adminPatch(`/admin/media-reflections/${segment(id)}`, reflectionBody(input), init);
}

/** Hard delete and not idempotent: a second call is a 404. */
export async function deleteMediaReflection(id: number, init?: RequestInit): Promise<void> {
  try {
    await adminDelete(`/admin/media-reflections/${segment(id)}`, init);
  } catch (reason) {
    if (!isNotFound(reason)) throw reason;
  }
}

export { mapReflection as mapMediaReflection };
export type { ApiReflection as ApiMediaReflection };
