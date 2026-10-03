import { compactFa, plainText } from "@/lib/meydan-api";
import type { ProfileDetails, ProfileStat } from "../types";
import type { ApiComment, ApiNarrative, ApiSquare } from "./profile-api-types";
import {
  emptyActivity,
  mapNarrative,
  mapNarrativePost,
  mapReply,
  timeFa,
} from "./profile-narrative-mappers";

const KIND_SUBTITLE: Record<string, string> = {
  square: "پایگاه فعال میدان",
  collective: "مجموعه‌ی فعال در میدان",
  media: "رسانه‌ی فعال در میدان",
  organization: "سازمان فعال در میدان",
};

function toFiniteNumber(value: unknown): number | undefined {
  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function squareCoordinates(square: ApiSquare): {
  latitude?: number;
  longitude?: number;
} {
  const latitude = toFiniteNumber(
    square.location?.latitude ??
      square.location?.lat ??
      square.latitude ??
      square.lat,
  );

  const longitude = toFiniteNumber(
    square.location?.longitude ??
      square.location?.lng ??
      square.longitude ??
      square.lng,
  );

  return {
    latitude,
    longitude,
  };
}

export function mapSquare(
  square: ApiSquare,
  narratives: ApiNarrative[] = [],
  replies: ApiComment[] = [],
  mediaReflectionCount?: number,
): ProfileDetails {
  const mappedNarratives = narratives.map(mapNarrative);

  const mappedActivity = mappedNarratives[0];

  const squareStats: ProfileStat[] = [
    {
      value: compactFa(square.stats?.narratives ?? narratives.length),
      label: "روایت منتشرشده",
    },
    ...(mediaReflectionCount === undefined
      ? []
      : [
          {
            value: `${compactFa(mediaReflectionCount)} روایت`,
            label: "بازتاب رسانه‌ای",
            tone: "success" as const,
          },
        ]),
  ];

  const identity = {
    name: square.name,

    handle: square.handle || `square_${square.id}`,

    subtitle: square.subtitle || KIND_SUBTITLE[square.kind ?? "square"] || KIND_SUBTITLE.square,

    location: square.location?.address || "",

    avatar: square.avatar_url || undefined,

    cover: square.cover_url || undefined,

    verified: Boolean(square.verified),
  };

  const coordinates = squareCoordinates(square);

  return {
    actorId: square.id,

    narrativeCount: square.stats?.narratives ?? null,

    startDate: square.start_date ?? undefined,

    accountType: "square",

    kind: square.kind,

    provinceId: square.location?.province_id,

    cityId: square.location?.city_id,

    latitude: coordinates.latitude,

    longitude: coordinates.longitude,

    initialTab: "square",

    identity,

    squareStats,

    resumeStats: square.resume_stats || [],

    schedule: (square.schedule || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((item, index) => ({
        id: String(item.id),

        title: item.title,

        time: timeFa(item.starts_at),

        startsAt: item.starts_at,

        highlighted: index === 1,
      })),

    activity: mappedActivity || emptyActivity(),

    narratives: mappedNarratives,

    narrativePosts: narratives.map((item) => mapNarrativePost(item, identity)),

    replies: replies.map(mapReply),

    about: plainText(square.profile_about || square.description || ""),
    handleLockedUntil: square.handle_locked_until ?? null,

    skills: square.profile_skills || [],
  };
}
