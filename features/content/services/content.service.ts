import { compactFa, meydanApi, persianDate, plainText } from "@/lib/meydan-api";
import type {
  ContentCategory,
  ContentDetailItem,
  ContentFile,
  ContentItem,
  ContentQuickAction,
  MediaKind,
  ScheduleItem,
} from "../types";

type ApiCreator = {
  id: number;
  name: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
};

type ApiContent = {
  id: number;
  slug?: string;
  title: string;
  excerpt?: string;
  body?: string;
  format?: string;
  category?: { slug?: string; name?: string } | null;
  attachments?: Array<{
    id: number;
    type?: string;
    url?: string;
    label?: string;
    filename?: string;
    size?: number;
    duration?: number;
  }>;
  creators?: ApiCreator[];
  tags?: string[];
  usage_note?: string;
  featured?: boolean;
  published_at?: string | null;
  stats?: { views?: number; downloads?: number };
  viewer_state?: { bookmarked?: boolean } | null;
  subtitle?: string;
  badge?: string;
  location_label?: string;
  media_duration?: string;
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

type ApiConfig = { quick_actions?: ContentQuickAction[] };

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

function coverOf(item: ApiContent): string | undefined {
  return item.attachments?.find((attachment) => attachment.type === "image")?.url;
}

function audioOf(item: ApiContent): string | undefined {
  const primary = item.attachments?.find(
    (attachment) => attachment.id === item.primary_attachment_id,
  );
  const audioAttachment =
    primary?.type === "audio"
      ? primary
      : item.attachments?.find((attachment) => attachment.type === "audio");

  return audioAttachment
    ? `/api/content/${item.id}/media/${audioAttachment.id}`
    : undefined;
}

function videoOf(item: ApiContent): string | undefined {
  const primary = item.attachments?.find(
    (attachment) => attachment.id === item.primary_attachment_id,
  );
  const videoAttachment =
    primary?.type === "video"
      ? primary
      : item.attachments?.find((attachment) => attachment.type === "video");

  return videoAttachment ? `/api/content/${item.id}/media/${videoAttachment.id}` : undefined;
}

function toItem(item: ApiContent): ContentItem {
  const kind = kindOf(item.format);
  return {
    id: item.slug || String(item.id),
    apiId: item.id,
    category: categoryOf(item),
    status: item.featured ? "urgent" : "ready",
    badge: item.badge || undefined,
    title: item.title,
    subtitle: item.subtitle || item.excerpt || "",
    description: item.excerpt || plainText(item.body || ""),
    author: item.creators?.[0]?.name,
    authorAvatar: item.creators?.[0]?.avatar_url,
    media: {
      kind: kind === "video" ? "image" : kind,
      duration: item.media_duration || undefined,
      audioSrc: audioOf(item),
      videoSrc: videoOf(item),
      description: mediaDescription(item.format),
      coverImage: coverOf(item),
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
  const creator = item.creators?.[0];
  const kind = kindOf(item.format);

  return {
    id: item.slug || String(item.id),
    apiId: item.id,
    category: kind === "video" ? "video" : categoryOf(item),
    status: item.featured ? "urgent" : "ready",
    badge: item.badge || undefined,
    title: item.title,
    subtitle: item.subtitle || item.excerpt || "",
    description: item.excerpt || plainText(item.body || ""),
    author: creator?.name,
    media: {
      kind,
      duration: item.media_duration || undefined,
      audioSrc: audioOf(item),
      videoSrc: videoOf(item),
      description: mediaDescription(item.format),
      coverImage:
        coverOf(item) ||
        (kind === "video"
          ? "/images/generated/feed/enghelab-gathering.png"
          : "/images/generated/content-hero.svg"),
    },
    creator: {
      name: creator?.name || "میدان خیابان",
      role: creator?.role || "تولیدکننده محتوا",
      avatar: creator?.avatar_url,
      bio: creator?.bio || "",
      publishedCount: "",
    },
    publishedAt: persianDate(item.published_at),
    location: item.location_label || undefined,
    viewCount: compactFa(item.stats?.views || 0),
    downloadCount: compactFa(item.stats?.downloads || 0),
    body: paragraphize(item.body),
    tags: item.tags || [],
    files: fileList(item),
    usageNote: item.usage_note || "",
    viewerState: { bookmarked: Boolean(item.viewer_state?.bookmarked) },
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

export async function getContentItems(): Promise<ContentItem[]> {
  return (await rawContent()).map(toItem);
}

export async function getContentDetailById(
  id: string,
): Promise<ContentDetailItem | undefined> {
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
}

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
