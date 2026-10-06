import { meydanApiPage } from "@/lib/meydan-api";
import type {
  AdminListResult,
  ContentAttachment,
  ContentCreatorRef,
  ContentInput,
  ContentItem,
} from "../types";
import {
  adminDelete,
  adminErrorMessage,
  adminGetItem,
  adminPatch,
  adminPost,
  isNotFound,
  query,
  segment,
} from "./admin-api";

export { adminErrorMessage, isNotFound };

/* ------------------------------------------------------------------- wire */

type ApiAttachment = {
  media_id?: number | null;
  id?: number | null;
  url?: string | null;
  type?: string | null;
  order?: number | null;
  caption?: string | null;
  label?: string | null;
  mime_type?: string | null;
  size?: number | null;
};

type ApiAttachedMedia = { media_id: number; media_title?: string; media_subtitle?: string; media_mime_type?: string; media_size?: number };

type ApiContent = {
  id: number;
  title?: string | null;
  slug?: string | null;
  body?: string | null;
  excerpt?: string | null;
  format?: string | null;
  content_type?: ContentItem["contentType"];
  is_user?: boolean;
  user_id?: number | null;
  creator_id?: number | null;
  time?: string | null;
  created_at?: string | null;
  view_counts?: number;
  media_cover?: number | null;
  attached_media?: ApiAttachedMedia[] | null;
  featured?: boolean | null;
  published_at?: string | null;
  category?: { id?: number; name?: string; slug?: string } | null;
  tags?: string[] | null;
  subtitle?: string | null;
  badge?: string | null;
  location_label?: string | null;
  media_duration?: string | null;
  series?: string | null;
  usage_note?: string | null;
  attachments?: ApiAttachment[] | null;
  files?: unknown[] | null;
  creators?: Array<{ id?: number; creator_id?: number; position?: number; role_label?: string | null }> | null;
  producer?: { id?: string; type?: string; display_name?: string; name?: string; avatar_url?: string | null } | null;
};

export function mapContent(row: ApiContent): ContentItem {
  const mediaById = new Map((row.attached_media ?? []).map((item) => [Number(item.media_id), item]));
  const attachments: ContentAttachment[] = (row.attachments ?? [])
    .filter((item) => Number(item?.media_id ?? item?.id ?? 0) > 0)
    .map((item, index) => ({
      mediaId: Number(item.media_id ?? item.id),
      order: Number(item.order ?? index + 1),
      caption: item.caption ?? null,
      label: item.label ?? null,
      mediaTitle: String(mediaById.get(Number(item.media_id ?? item.id))?.media_title ?? item.label ?? ""),
      mediaSubtitle: String(mediaById.get(Number(item.media_id ?? item.id))?.media_subtitle ?? item.caption ?? ""),
      mimeType: String(mediaById.get(Number(item.media_id ?? item.id))?.media_mime_type ?? item.mime_type ?? ""),
      size: Number(mediaById.get(Number(item.media_id ?? item.id))?.media_size ?? item.size ?? 0),
    }));

  const creators: ContentCreatorRef[] = (row.creators ?? [])
    .filter((item) => Number(item?.id ?? item?.creator_id ?? 0) > 0)
    .map((item, index) => ({
      id: Number(item.id ?? item.creator_id),
      position: Number(item.position ?? index),
      roleLabel: String(item.role_label ?? ""),
    }));

  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    body: String(row.body ?? ""),
    excerpt: String(row.excerpt ?? ""),
    format: String(row.format ?? "mixed"),
    contentType: row.content_type ?? null,
    isUser: Boolean(row.is_user),
    userId: row.user_id ?? null,
    creatorId: row.creator_id ?? null,
    time: row.time ?? null,
    createdAt: row.created_at ?? null,
    viewCounts: Number(row.view_counts ?? 0),
    mediaCover: row.media_cover ?? null,
    featured: Boolean(row.featured),
    publishedAt: row.published_at ? String(row.published_at) : null,
    category: row.category?.id
      ? {
          id: Number(row.category.id),
          name: String(row.category.name ?? ""),
          slug: String(row.category.slug ?? ""),
        }
      : null,
    tags: (row.tags ?? []).map(String),
    subtitle: String(row.subtitle ?? ""),
    badge: String(row.badge ?? ""),
    locationLabel: String(row.location_label ?? ""),
    mediaDuration: String(row.media_duration ?? ""),
    series: String(row.series ?? ""),
    usageNote: String(row.usage_note ?? ""),
    attachments,
    files: (row.files ?? []).map((file) =>
      typeof file === "string" ? file : String((file as { url?: string })?.url ?? ""),
    ),
    creators,
    producer: row.producer
      ? {
          type: String(row.producer.type ?? ""),
          id: String(row.producer.id ?? ""),
          name: String(row.producer.display_name ?? row.producer.name ?? ""),
          avatarUrl: row.producer.avatar_url || null,
        }
      : null,
  };
}

/* ------------------------------------------------------------------- reads */

export type ContentFilters = {
  format: string;
  featured: boolean;
  category: string;
  tag: string;
};

export const EMPTY_CONTENT_FILTERS: ContentFilters = {
  format: "",
  featured: false,
  category: "",
  tag: "",
};

/** Admin content pages 20 at a time with a cursor. */
export const CONTENT_PAGE_SIZE = 20;

export function contentListPath(filters: ContentFilters, cursor?: string | null): string {
  return `/admin/content${query({
    format: filters.format,
    featured: filters.featured ? "true" : "",
    category: filters.category,
    tag: filters.tag,
    cursor: cursor || "",
  })}`;
}

export async function getContentList(
  filters: ContentFilters,
  cursor?: string | null,
  init?: RequestInit,
): Promise<{ items: ContentItem[]; nextCursor: string | null }> {
  const { data, nextCursor } = await meydanApiPage<ApiContent[]>(
    contentListPath(filters, cursor),
    init,
  );
  return { items: (data ?? []).map(mapContent), nextCursor };
}

export const CONTENT_LIST_LIMITATION =
  "فهرست فعلاً محتواهای منتشرشده را نمایش می‌دهد.";

export async function getContent(
  id: string,
  init?: RequestInit,
): Promise<ContentItem | null> {
  try {
    return mapContent(await adminGetItem<ApiContent>(`/admin/content/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

export type ContentListResult = AdminListResult<ContentItem> & { nextCursor: string | null };

/* ------------------------------------------------------------------ writes */

/**
 * `POST /admin/content` answers `data: null` for anything that is not a
 * published post, so the caller must never read the response body — it only
 * learns that the write succeeded.
 */
export function contentBody(input: ContentInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    body: input.body,
    excerpt: input.excerpt,
    status: input.status,
    format: input.format,
    content_type: input.contentType,
    is_user: input.isUser,
    user_id: input.isUser ? input.userId : null,
    creator_id: input.isUser ? null : input.creatorId,
    ...(input.time ? { time: input.time } : {}),
    media_cover: input.mediaCover,
    usage_note: input.usageNote,
    subtitle: input.subtitle,
    badge: input.badge,
    location_label: input.locationLabel,
    media_duration: input.mediaDuration,
    series: input.series,
    featured: input.featured,
    attached_media: input.attachments.map((attachment) => ({
      media_id: attachment.mediaId,
      media_title: attachment.mediaTitle,
      media_subtitle: attachment.mediaSubtitle,
    })),
    tags: input.tags,
    // One category by slug; null clears it.
    category: input.category ?? null,
  };
  return body;
}

/** Returns the created row when the backend sent one, otherwise `null`. */
export async function createContent(input: ContentInput, init?: RequestInit): Promise<ContentItem | null> {
  const created = await adminPost<ApiContent | null>("/admin/content", contentBody(input), init);
  return created && created.id ? mapContent(created) : null;
}

export async function updateContent(
  id: string,
  input: ContentInput,
  init?: RequestInit,
): Promise<ContentItem | null> {
  const saved = await adminPatch<ApiContent | null>(
    `/admin/content/${segment(id)}`,
    contentBody(input),
    init,
  );
  return saved && saved.id ? mapContent(saved) : null;
}

/** Soft delete (`wp_trash_post`). */
export async function deleteContent(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/content/${segment(id)}`, init);
}

export type ContentPoster = { mediaId: number | null; imageUrl: string | null; href: string };
type ApiPoster = { media_id?: number | null; image_url?: string | null; href?: string | null };
const mapPoster = (row: ApiPoster): ContentPoster => ({
  mediaId: row.media_id ?? null,
  imageUrl: row.image_url ?? null,
  href: row.href ?? "",
});
export async function getContentPoster(init?: RequestInit): Promise<ContentPoster> {
  return mapPoster(await adminGetItem<ApiPoster>("/admin/content/poster", init));
}
export async function updateContentPoster(input: Pick<ContentPoster, "mediaId" | "href">): Promise<ContentPoster> {
  return mapPoster(await adminPatch<ApiPoster>("/admin/content/poster", { media_id: input.mediaId, href: input.href }));
}
