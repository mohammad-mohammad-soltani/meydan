import { compactFa, meydanApi, meydanApiPage, persianDate, plainText, stripMarkdown } from "@/lib/meydan-api";
import { cache } from "react";
import type {
  ContentCategory,
  ContentDetailItem,
  ContentFile,
  ContentItem,
  ContentQuickAction,
  ContentPoster,
  MediaKind,
  ScheduleItem,
} from "../types";
import {
  contentProducer,
  type ContentProducerSource,
  type LegacyContentCreator,
} from "./content-producer";
import { contentCover, firstBodyImage, type ContentCoverAttachment } from "./content-cover";
import { contentVideo, type ContentVideoAttachment } from "./content-video";
import { contentAudioSource } from "./content-audio";

type ApiCreator = LegacyContentCreator & {
  id: number;
};

export type ApiContent = {
  id: number;
  slug?: string;
  title: string;
  excerpt?: string;
  body?: string;
  format?: string;
  content_type?: string | null;
  media_cover_url?: string | null;
  category?: { slug?: string; name?: string } | null;
  attachments?: Array<ContentCoverAttachment & ContentVideoAttachment & {
    label?: string;
    filename?: string;
    size?: number;
    duration?: number;
  }>;
  creators?: ApiCreator[];
  producer?: ContentProducerSource | null;
  tags?: string[];
  usage_note?: string;
  featured?: boolean;
  published_at?: string | null;
  stats?: { views?: number; downloads?: number; likes?: number };
  viewer_state?: { bookmarked?: boolean; liked?: boolean } | null;
  subtitle?: string;
  badge?: string;
  location_label?: string;
  media_duration?: string;
  series?: string | null;
  /** Where the item opens when it is not a content page (audio attached to a post). */
  href?: string;
  reading_minutes?: number | null;
  primary_attachment_id?: number;
  files?: Array<{
    id: string | number;
    label: string;
    format: string;
    size: string;
    detail: string;
  }>;
};

type ApiCampaign = {
  schedule?: Array<{
    id?: string | number;
    night?: string;
    number?: string;
    title?: string;
    description?: string;
    current?: boolean;
  }>;
};

type ApiConfig = { quick_actions?: ContentQuickAction[]; content_poster?: { image_url?: string | null; href?: string | null } };

function categoryOf(item: ApiContent): ContentCategory {
  const slug = item.category?.slug;
  if (
    slug === "talks" ||
    slug === "audio" ||
    slug === "schedule" ||
    slug === "featured"
  ) {
    return slug;
  }
  if (item.format === "audio") return "audio";
  return item.featured ? "featured" : "talks";
}

function kindOf(format?: string): MediaKind | "video" {
  if (format === "audio") return "audio";
  if (format === "video") return "video";
  if (format === "document") return "document";
  return "image";
}

function mediaDescription(format?: string): string {
  if (format === "audio") return "فایل صوتی";
  if (format === "video") return "ویدئو";
  if (format === "document") return "فیش و سند";
  return "تصویر و متن";
}

function audioOf(item: ApiContent): string | undefined {
  return contentAudioSource(item.primary_attachment_id, item.attachments);
}

export function toItem(item: ApiContent): ContentItem {
  const kind = kindOf(item.format);
  const producer = contentProducer(item.producer, item.creators);
  const video = contentVideo(item.id, item.primary_attachment_id, item.attachments);
  return {
    id: item.slug || String(item.id),
    apiId: item.id,
    contentType: item.content_type,
    category: categoryOf(item),
    status: item.featured ? "urgent" : "ready",
    badge: item.badge || undefined,
    title: stripMarkdown(item.title),
    subtitle: stripMarkdown(item.subtitle || item.excerpt || ""),
    description: stripMarkdown(item.excerpt || plainText(item.body || "")),
    author: producer.name,
    authorAvatar: producer.avatar,
    authorHref: producer.profileHref,
    authorVerified: producer.verified,
    authorSpeaker: producer.speaker,
    authorOfficial: producer.official,
    authorKind: producer.actorType,
    // Without a chosen cover a note shows the first picture it contains (attachment, then body).
    coverUrl: item.media_cover_url || contentCover(item.attachments, item.format) || firstBodyImage(item.body) || undefined,
    series: item.series || undefined,
    href: item.href || undefined,
    readingMinutes: item.reading_minutes || undefined,
    publishedAt: item.published_at || undefined,
    categoryName: item.category?.name || undefined,
    categorySlug: item.category?.slug || undefined,
    bookmarked: Boolean(item.viewer_state?.bookmarked),
    media: {
      kind: kind === "video" ? "image" : kind,
      duration: item.media_duration || undefined,
      audioSrc: audioOf(item),
      videoSrc: video?.src,
      videoWidth: video?.width,
      videoHeight: video?.height,
      description: mediaDescription(item.format),
      coverImage: contentCover(item.attachments, item.format),
    },
  };
}

function paragraphize(value?: string): string[] {
  const text = plainText(value || "");
  return text
    ? text
        .split(/\n+/)
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
}

function fileList(item: ApiContent): ContentFile[] {
  const attachments = item.attachments || [];
  if (attachments.length) {
    return attachments.map((file) => ({
      id: String(file.id),
      url: file.url,
      label: file.label || file.filename || "فایل",
      format: (file.filename?.split(".").pop() || file.type || "FILE").toUpperCase(),
      size: file.size ? `${compactFa(file.size)} بایت` : "",
      detail: file.type === "audio" ? "فایل صوتی" : "فایل ضمیمه",
    }));
  }

  return (item.files || []).map((file) => ({
    id: String(file.id),
    label: file.label,
    format: file.format,
    size: file.size,
    detail: file.detail,
  }));
}

function toDetail(item: ApiContent): ContentDetailItem {
  const creator = contentProducer(item.producer, item.creators);
  const primary = item.attachments?.find((attachment) => attachment.id === item.primary_attachment_id);
  const video = contentVideo(item.id, item.primary_attachment_id, item.attachments);
  const audioSrc = audioOf(item);
  const kind = primary?.type === "video" ? "video" : primary?.type === "audio" ? "audio" : primary?.type === "image" ? "image" : primary?.type === "document" ? "document" : video ? "video" : audioSrc ? "audio" : kindOf(item.format);

  return {
    id: item.slug || String(item.id),
    apiId: item.id,
    contentType: item.content_type,
    category: kind === "video" ? "video" : categoryOf(item),
    status: item.featured ? "urgent" : "ready",
    badge: item.badge || undefined,
    title: stripMarkdown(item.title),
    subtitle: stripMarkdown(item.subtitle || item.excerpt || ""),
    description: stripMarkdown(item.excerpt || plainText(item.body || "")),
    author: creator.name,
    media: {
      kind,
      duration: item.media_duration || undefined,
      audioSrc,
      videoSrc: video?.src,
      videoWidth: video?.width,
      videoHeight: video?.height,
      description: mediaDescription(item.format),
      coverImage: item.media_cover_url || contentCover(item.attachments, kind === "video" ? "video" : item.format, item.primary_attachment_id),
    },
    creator: {
      ...creator,
    },
    publishedAt: persianDate(item.published_at),
    location: item.location_label || undefined,
    viewCount: compactFa(item.stats?.views || 0),
    downloadCount: compactFa(item.stats?.downloads || 0),
    body: paragraphize(item.body),
    tags: item.tags || [],
    files: fileList(item),
    usageNote: item.usage_note || "",
    viewerState: { bookmarked: Boolean(item.viewer_state?.bookmarked), liked: Boolean(item.viewer_state?.liked) },
    readingMinutes: item.reading_minutes || undefined,
    categoryName: item.category?.name || undefined,
    categorySlug: item.category?.slug || undefined,
    likeCount: item.stats?.likes || 0,
  };
}

function normalizeContentIdentifier(value: string): string {
  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep malformed or already-decoded slugs comparable instead of failing the page.
  }

  return decoded.normalize("NFC");
}

async function rawContent(): Promise<ApiContent[]> {
  return meydanApi<ApiContent[]>("/content");
}

/** The viewer's bookmarked content packages (`/me/bookmarks`). */
export async function getBookmarkedContent(init?: RequestInit): Promise<ContentItem[]> {
  return (await meydanApi<ApiContent[]>("/me/bookmarks", init)).map(toItem);
}

export async function getContentItems(): Promise<ContentItem[]> {
  return (await rawContent()).map(toItem);
}

export async function getSpeechContentPage(cursor?: string | null): Promise<{ items: ContentItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ content_type: "speech" });
  if (cursor) params.set("cursor", cursor);
  const page = await meydanApiPage<ApiContent[]>(`/content?${params}`);
  return { items: (page.data ?? []).map(toItem), nextCursor: page.nextCursor };
}

export async function getMusicVideoContentPage(cursor?: string | null): Promise<{ items: ContentItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ content_type: "music_video" });
  if (cursor) params.set("cursor", cursor);
  const page = await meydanApiPage<ApiContent[]>(`/content?${params}`);
  return { items: (page.data ?? []).map(toItem), nextCursor: page.nextCursor };
}

export async function getContentPoster(): Promise<ContentPoster> {
  const config = await meydanApi<ApiConfig>("/config");
  return { imageUrl: config.content_poster?.image_url ?? null, href: config.content_poster?.href ?? "" };
}

export const getContentDetailById = cache(async function getContentDetailById(
  id: string,
): Promise<ContentDetailItem | undefined> {
  if (/^[1-9]\d*$/.test(id)) {
    try {
      return toDetail(await meydanApi<ApiContent>(`/content/${id}`));
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404) return undefined;
      throw error;
    }
  }
  const list = await rawContent();
  const normalizedId = normalizeContentIdentifier(id);
  const match = list.find(
    (item) =>
      String(item.id) === id ||
      (item.slug
        ? normalizeContentIdentifier(item.slug) === normalizedId
        : false),
  );
  if (!match) return undefined;
  const detail = await meydanApi<ApiContent>(`/content/${match.id}`);
  return toDetail(detail);
});

export async function getContentDetailItems(): Promise<ContentDetailItem[]> {
  return (await rawContent()).map(toDetail);
}

export async function getScheduleItems(): Promise<ScheduleItem[]> {
  const campaign = await meydanApi<ApiCampaign | null>("/campaigns/current");
  return (campaign?.schedule || []).map((item, index) => ({
    id: String(item.id ?? index),
    night: item.night || "",
    number:
      item.number ||
      new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(
        index + 1,
      ),
    title: item.title || "",
    description: item.description || "",
    current: Boolean(item.current),
  }));
}

export async function getContentQuickActions(): Promise<ContentQuickAction[]> {
  const config = await meydanApi<ApiConfig>("/config");
  return config.quick_actions || [];
}
