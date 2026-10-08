import type {
  AdminPage,
  Memorial,
  MemorialCreateInput,
  MemorialFilters,
  MemorialFrame,
  MemorialStatus,
  MemorialTimelineEvent,
  MemorialUpdateInput,
} from "../types";
import {
  adminDelete,
  adminErrorMessage,
  adminGetEnvelope,
  adminGetItem,
  adminPatch,
  adminPost,
  adminPut,
  isNotFound,
  metaInt,
  query,
  segment,
} from "./admin-api";

export { adminErrorMessage, isNotFound };

/* ------------------------------------------------------------------- wire */

type ApiFrame = {
  media_id: number;
  order?: number | null;
  caption?: string | null;
  label?: string | null;
  url?: string | null;
};

type ApiTimelineEvent = {
  id: string;
  date?: string | null;
  title?: string | null;
  description?: string | null;
  photo_media_id?: number | null;
  order?: number | null;
};

type ApiMemorial = {
  id: number;
  name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  verified?: boolean | null;
  post_status?: string | null;
  owner_user_id?: number | null;
  biography?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  timeline?: ApiTimelineEvent[] | null;
  frames?: ApiFrame[] | null;
};

/* ------------------------------------------------------------------ mappers */

function mapFrame(row: ApiFrame): MemorialFrame {
  return {
    mediaId: Number(row.media_id),
    order: Number(row.order ?? 0),
    caption: String(row.caption ?? ""),
    label: String(row.label ?? ""),
    url: row.url || null,
  };
}

function mapTimelineEvent(row: ApiTimelineEvent): MemorialTimelineEvent {
  return {
    id: String(row.id),
    date: String(row.date ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    photoMediaId: row.photo_media_id ? Number(row.photo_media_id) : null,
    order: Number(row.order ?? 0),
  };
}

export function mapMemorial(row: ApiMemorial): Memorial {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    handle: String(row.handle ?? ""),
    avatarUrl: row.avatar_url || null,
    coverUrl: row.cover_url || null,
    verified: Boolean(row.verified),
    postStatus: (row.post_status as MemorialStatus) || "draft",
    ownerUserId: row.owner_user_id ? Number(row.owner_user_id) : null,
    biography: String(row.biography ?? ""),
    birthDate: String(row.birth_date ?? ""),
    deathDate: String(row.death_date ?? ""),
    timeline: (row.timeline ?? []).map(mapTimelineEvent).sort((a, b) => a.order - b.order),
    frames: (row.frames ?? []).map(mapFrame).sort((a, b) => a.order - b.order),
  };
}

/* ------------------------------------------------------------------- reads */

export function memorialsListPath(filters: MemorialFilters, page = 1, perPage = 20): string {
  return `/admin/memorials${query({ q: filters.q.trim(), page, per_page: perPage })}`;
}

export async function getMemorials(
  filters: MemorialFilters,
  page = 1,
  perPage = 20,
  init?: RequestInit,
): Promise<AdminPage<Memorial>> {
  const { data, meta } = await adminGetEnvelope<ApiMemorial[]>(
    memorialsListPath(filters, page, perPage),
    init,
  );
  const items = (data ?? []).map(mapMemorial);
  const total = metaInt(meta, ["total"], items.length);
  const perPageReported = metaInt(meta, ["per_page"], perPage);
  const pages = metaInt(
    meta,
    ["pages"],
    perPageReported > 0 ? Math.max(1, Math.ceil(total / perPageReported)) : 1,
  );

  return {
    items,
    page: metaInt(meta, ["page"], page),
    perPage: perPageReported,
    total,
    pages,
    paginated: "total" in meta,
  };
}

/** `null` (rather than a throw) when the memorial is gone, so the route can 404. */
export async function getMemorial(id: string, init?: RequestInit): Promise<Memorial | null> {
  try {
    return mapMemorial(await adminGetItem<ApiMemorial>(`/admin/memorials/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

/* ------------------------------------------------------------------ writes */

export function memorialCreateBody(input: MemorialCreateInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    handle: input.handle.trim(),
    biography: input.biography,
    birth_date: input.birthDate.trim(),
    death_date: input.deathDate.trim(),
    avatar_media_id: input.avatarMediaId ?? 0,
    cover_media_id: input.coverMediaId ?? 0,
    status: input.status,
  };
}

export async function createMemorial(
  input: MemorialCreateInput,
  init?: RequestInit,
): Promise<Memorial> {
  const created = await adminPost<ApiMemorial>("/admin/memorials", memorialCreateBody(input), init);
  return mapMemorial(created ?? ({ id: 0 } as ApiMemorial));
}

export function memorialUpdateBody(input: MemorialUpdateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.handle !== undefined && input.handle.trim() !== "") body.handle = input.handle.trim();
  if (input.biography !== undefined) body.biography = input.biography;
  if (input.birthDate !== undefined) body.birth_date = input.birthDate.trim();
  if (input.deathDate !== undefined) body.death_date = input.deathDate.trim();
  if (input.avatarMediaId !== undefined) body.avatar_media_id = input.avatarMediaId ?? 0;
  if (input.coverMediaId !== undefined) body.cover_media_id = input.coverMediaId ?? 0;
  if (input.status !== undefined) body.status = input.status;
  if (input.verified !== undefined) body.verified = input.verified;
  return body;
}

export async function updateMemorial(
  id: string,
  input: MemorialUpdateInput,
  init?: RequestInit,
): Promise<Memorial> {
  return mapMemorial(
    await adminPatch<ApiMemorial>(`/admin/memorials/${segment(id)}`, memorialUpdateBody(input), init),
  );
}

export async function deleteMemorial(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/memorials/${segment(id)}`, init);
}

/* ---------------------------------------------------------------- timeline */

export async function setMemorialTimeline(
  id: string,
  events: MemorialTimelineEvent[],
  init?: RequestInit,
): Promise<MemorialTimelineEvent[]> {
  const body = {
    timeline: events.map((event) => ({
      id: event.id,
      date: event.date,
      title: event.title,
      description: event.description,
      photo_media_id: event.photoMediaId ?? 0,
    })),
  };
  const saved = await adminPut<ApiTimelineEvent[]>(`/admin/memorials/${segment(id)}/timeline`, body, init);
  return (saved ?? []).map(mapTimelineEvent).sort((a, b) => a.order - b.order);
}

/* ------------------------------------------------------------------ frames */

export async function addMemorialFrame(
  id: string,
  mediaId: number,
  caption = "",
  label = "",
  init?: RequestInit,
): Promise<MemorialFrame[]> {
  const saved = await adminPost<ApiFrame[]>(
    `/admin/memorials/${segment(id)}/frames`,
    { media_id: mediaId, caption, label },
    init,
  );
  return (saved ?? []).map(mapFrame).sort((a, b) => a.order - b.order);
}

export async function updateMemorialFrame(
  id: string,
  mediaId: number,
  patch: { caption?: string; label?: string },
  init?: RequestInit,
): Promise<MemorialFrame[]> {
  const saved = await adminPatch<ApiFrame[]>(
    `/admin/memorials/${segment(id)}/frames/${segment(mediaId)}`,
    patch,
    init,
  );
  return (saved ?? []).map(mapFrame).sort((a, b) => a.order - b.order);
}

export async function removeMemorialFrame(
  id: string,
  mediaId: number,
  init?: RequestInit,
): Promise<MemorialFrame[]> {
  const saved = await adminDelete<ApiFrame[]>(`/admin/memorials/${segment(id)}/frames/${segment(mediaId)}`, undefined, init);
  return (saved ?? []).map(mapFrame).sort((a, b) => a.order - b.order);
}

export async function reorderMemorialFrames(
  id: string,
  mediaIds: number[],
  init?: RequestInit,
): Promise<MemorialFrame[]> {
  const saved = await adminPut<ApiFrame[]>(
    `/admin/memorials/${segment(id)}/frames/order`,
    { media_ids: mediaIds },
    init,
  );
  return (saved ?? []).map(mapFrame).sort((a, b) => a.order - b.order);
}
