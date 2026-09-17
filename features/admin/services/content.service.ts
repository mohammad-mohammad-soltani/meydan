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
};

type ApiContent = {
  id: number;
  title?: string | null;
  slug?: string | null;
  body?: string | null;
  excerpt?: string | null;
  format?: string | null;
  featured?: boolean | null;
  published_at?: string | null;
  category?: { id?: number; name?: string; slug?: string } | null;
  tags?: string[] | null;
  subtitle?: string | null;
  badge?: string | null;
  location_label?: string | null;
  media_duration?: string | null;
  usage_note?: string | null;
  attachments?: ApiAttachment[] | null;
  files?: unknown[] | null;
  creators?: Array<{ id?: number; creator_id?: number; position?: number; role_label?: string | null }> | null;
  producer?: { id?: string; type?: string; display_name?: string; name?: string; avatar_url?: string | null } | null;
};

export function mapContent(row: ApiContent): ContentItem {
  const attachments: ContentAttachment[] = (row.attachments ?? [])
    .filter((item) => Number(item?.media_id ?? item?.id ?? 0) > 0)
    .map((item, index) => ({
      mediaId: Number(item.media_id ?? item.id),
      order: Number(item.order ?? index + 1),
      caption: item.caption ?? null,
      label: item.label ?? null,
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

/** `/content` pages 20 at a time with a cursor, and only ever returns publish. */
export const CONTENT_PAGE_SIZE = 20;

export function contentListPath(filters: ContentFilters, cursor?: string | null): string {
  return `/content${query({
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

/**
 * There is no `/admin/content` list, so the admin list is the *public* list:
 * it can only ever show published rows. The view says so rather than pretending
 * the drafts are hidden by a filter.
 */
export const CONTENT_LIST_LIMITATION =
  "فهرست محتوا فقط موارد منتشرشده را نشان می‌دهد؛ برای دیدن پیش‌نویس‌ها از پیشخوان وردپرس استفاده کنید.";

export async function getContent(
  id: string,
  init?: RequestInit,
): Promise<ContentItem | null> {
  try {
    return mapContent(await adminGetItem<ApiContent>(`/content/${segment(id)}`, init));
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
    usage_note: input.usageNote,
    subtitle: input.subtitle,
    badge: input.badge,
    location_label: input.locationLabel,
    media_duration: input.mediaDuration,
    featured: input.featured,
    attachments: input.attachments.map((attachment, index) => ({
      media_id: attachment.mediaId,
      order: index + 1,
      ...(attachment.caption ? { caption: attachment.caption } : {}),
      ...(attachment.label ? { label: attachment.label } : {}),
    })),
    tags: input.tags,
    // The controller writes a single category id, not a list.
    ...(input.category ? { category: input.category } : {}),
    creators: input.creators.map((creator, index) => ({
      id: creator.id,
      position: creator.position || index,
      role_label: creator.roleLabel,
    })),
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
