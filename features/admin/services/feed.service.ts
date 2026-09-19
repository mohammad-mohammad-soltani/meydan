import type { AdminFeedSettings, FeedPreview, FeedPreviewItem, FreshnessBucket } from "../types";
import { feedSettingsBody } from "../lib/feed-settings";
import { adminGetItem, adminPut, query } from "./admin-api";

type ApiFreshnessBucket = { min_hours?: number; max_hours?: number; multiplier?: number };
type ApiSettings = Record<string, unknown> & { freshness_buckets?: ApiFreshnessBucket[] | null };
type ApiPreviewItem = Record<string, unknown>;

export type AdminFeedSettingsResponse = { settings: AdminFeedSettings; defaults: AdminFeedSettings };

function number(row: ApiSettings | ApiPreviewItem, key: string): number {
  const value = Number(row[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function mapBucket(bucket: ApiFreshnessBucket): FreshnessBucket {
  return { minHours: Number(bucket.min_hours ?? 0), maxHours: Number(bucket.max_hours ?? 0), multiplier: Number(bucket.multiplier ?? 0) };
}

export function mapFeedSettings(row: ApiSettings): AdminFeedSettings {
  return {
    feedAlgorithmV2Enabled: Boolean(row.feed_algorithm_v2_enabled),
    likeWeight: number(row, "like_weight"), viewWeight: number(row, "view_weight"),
    commentWeight: number(row, "comment_weight"), shareWeight: number(row, "share_weight"),
    maxEngagementScore: number(row, "max_engagement_score"),
    squareRoleMultiplier: number(row, "square_role_multiplier"), speakerRoleMultiplier: number(row, "speaker_role_multiplier"),
    officialRoleMultiplier: number(row, "official_role_multiplier"), editorialMultiplier: number(row, "editorial_multiplier"),
    goodDeedMultiplier: number(row, "good_deed_multiplier"), sameCityMultiplier: number(row, "same_city_multiplier"),
    sameProvinceMultiplier: number(row, "same_province_multiplier"), followingMultiplier: number(row, "following_multiplier"),
    maxTotalBoost: number(row, "max_total_boost"), maxPostAgeHours: number(row, "max_post_age_hours"),
    candidatePoolSize: number(row, "candidate_pool_size"), maxSameAuthorInTopN: number(row, "max_same_author_in_top_n"),
    diversityTopN: number(row, "diversity_top_n"), freshnessBuckets: (row.freshness_buckets ?? []).map(mapBucket),
  };
}

function mapResponse(row: { settings?: ApiSettings; defaults?: ApiSettings }): AdminFeedSettingsResponse {
  return { settings: mapFeedSettings(row.settings ?? {}), defaults: mapFeedSettings(row.defaults ?? {}) };
}

export async function getFeedSettings(init?: RequestInit): Promise<AdminFeedSettingsResponse> {
  return mapResponse(await adminGetItem<{ settings?: ApiSettings; defaults?: ApiSettings }>("/admin/feed/settings", init));
}

export async function updateFeedSettings(settings: AdminFeedSettings, init?: RequestInit): Promise<AdminFeedSettingsResponse> {
  return mapResponse(await adminPut<AdminFeedSettingsResponse>("/admin/feed/settings", feedSettingsBody(settings), init));
}

export async function resetFeedSettings(init?: RequestInit): Promise<AdminFeedSettingsResponse> {
  return mapResponse(await adminPut<AdminFeedSettingsResponse>("/admin/feed/settings", { reset: true }, init));
}

function mapPreviewItem(row: ApiPreviewItem): FeedPreviewItem {
  return {
    narrativeId: number(row, "narrative_id"), rank: number(row, "rank"),
    sourceNames: Array.isArray(row.source_names) ? row.source_names.map(String) : [],
    score: number(row, "score"), baseScore: number(row, "base_score"),
    freshnessMultiplier: number(row, "freshness_multiplier"), roleMultiplier: number(row, "role_multiplier"),
    locationMultiplier: number(row, "location_multiplier"), editorialMultiplier: number(row, "editorial_multiplier"),
    goodDeedMultiplier: number(row, "good_deed_multiplier"), followingMultiplier: number(row, "following_multiplier"),
  };
}

export async function previewFeed(userId: number, limit = 20, init?: RequestInit): Promise<FeedPreview> {
  const payload = await adminGetItem<{ algorithm_version?: string; items?: ApiPreviewItem[] }>(
    `/admin/feed/preview${query({ user_id: userId, limit })}`,
    init,
  );
  return { algorithmVersion: String(payload.algorithm_version ?? "feed-v2"), items: (payload.items ?? []).map(mapPreviewItem) };
}
