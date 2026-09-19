import type { AdminFeedSettings, FreshnessBucket } from "../types";

export type FeedSettingsValidation = Partial<Record<keyof AdminFeedSettings, string>>;

const numberFields: Array<keyof Omit<AdminFeedSettings, "feedAlgorithmV2Enabled" | "freshnessBuckets">> = [
  "likeWeight", "viewWeight", "commentWeight", "shareWeight", "maxEngagementScore",
  "squareRoleMultiplier", "speakerRoleMultiplier", "officialRoleMultiplier", "editorialMultiplier",
  "goodDeedMultiplier", "sameCityMultiplier", "sameProvinceMultiplier", "followingMultiplier",
  "maxTotalBoost", "maxPostAgeHours", "candidatePoolSize", "maxSameAuthorInTopN", "diversityTopN",
];

const integerRanges: Partial<Record<keyof AdminFeedSettings, readonly [number, number]>> = {
  maxPostAgeHours: [1, 168],
  candidatePoolSize: [1, 1000],
  maxSameAuthorInTopN: [1, 100],
  diversityTopN: [1, 100],
};

function validNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Mirrors the backend's constraints for immediate form feedback. The API remains authoritative. */
export function validateFeedSettings(settings: AdminFeedSettings): FeedSettingsValidation {
  const errors: FeedSettingsValidation = {};
  for (const field of numberFields) {
    const value = settings[field] as number;
    const range = integerRanges[field];
    if (!validNumber(value) || (range && (!Number.isInteger(value) || value < range[0] || value > range[1]))) {
      errors[field] = "مقدار واردشده معتبر نیست.";
    }
  }
  if (!Number.isFinite(settings.maxSameAuthorInTopN) || settings.maxSameAuthorInTopN > settings.diversityTopN) {
    errors.maxSameAuthorInTopN = "نباید از اندازهٔ Diversity بیشتر باشد.";
  }

  let expectedMin = 0;
  for (const bucket of settings.freshnessBuckets) {
    if (!validBucket(bucket) || bucket.minHours !== expectedMin || bucket.maxHours > settings.maxPostAgeHours) {
      errors.freshnessBuckets = "بازه‌های تازگی باید پیوسته و تا حداکثر سن محتوا باشند.";
      break;
    }
    expectedMin = bucket.maxHours;
  }
  if (expectedMin !== settings.maxPostAgeHours) {
    errors.freshnessBuckets = "بازه‌های تازگی باید پیوسته و تا حداکثر سن محتوا باشند.";
  }
  return errors;
}

/** Converts the form model to the documented WordPress settings contract. */
export function feedSettingsBody(settings: AdminFeedSettings): Record<string, unknown> {
  return {
    feed_algorithm_v2_enabled: settings.feedAlgorithmV2Enabled,
    like_weight: settings.likeWeight, view_weight: settings.viewWeight,
    comment_weight: settings.commentWeight, share_weight: settings.shareWeight,
    max_engagement_score: settings.maxEngagementScore,
    square_role_multiplier: settings.squareRoleMultiplier, speaker_role_multiplier: settings.speakerRoleMultiplier,
    official_role_multiplier: settings.officialRoleMultiplier, editorial_multiplier: settings.editorialMultiplier,
    good_deed_multiplier: settings.goodDeedMultiplier, same_city_multiplier: settings.sameCityMultiplier,
    same_province_multiplier: settings.sameProvinceMultiplier, following_multiplier: settings.followingMultiplier,
    max_total_boost: settings.maxTotalBoost, max_post_age_hours: settings.maxPostAgeHours,
    candidate_pool_size: settings.candidatePoolSize, max_same_author_in_top_n: settings.maxSameAuthorInTopN,
    diversity_top_n: settings.diversityTopN,
    freshness_buckets: settings.freshnessBuckets.map((bucket) => ({ min_hours: bucket.minHours, max_hours: bucket.maxHours, multiplier: bucket.multiplier })),
  };
}

function validBucket(bucket: FreshnessBucket): boolean {
  return Number.isFinite(bucket.minHours)
    && Number.isFinite(bucket.maxHours)
    && Number.isFinite(bucket.multiplier)
    && bucket.maxHours > bucket.minHours
    && bucket.multiplier >= 0
    && bucket.multiplier <= 100;
}
