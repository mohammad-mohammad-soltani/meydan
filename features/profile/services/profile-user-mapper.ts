import { compactFa, plainText } from "@/lib/meydan-api";
import type { ProfileDetails } from "../types";
import type {
  ApiComment,
  ApiNarrative,
  ApiSpeaker,
  ApiUserProfile,
} from "./profile-api-types";
import {
  emptyActivity,
  mapNarrative,
  mapNarrativePost,
  mapReply,
} from "./profile-narrative-mappers";

function cleanStrings(values: unknown): string[] {
  return (Array.isArray(values) ? values : [])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

/**
 * A speaker account is a user account that also carries a curated speaker
 * record. `speaker` is only present on `/me`; public profiles keep deriving the
 * badge from the actor fields.
 */
export function mapUser(
  profile: ApiUserProfile,
  narrativeItems: ApiNarrative[] = [],
  replies: ApiComment[] = [],
  speaker: ApiSpeaker | null = null,
): ProfileDetails {
  const narratives = profile.stats?.narratives || narrativeItems.length || 0;

  const identity = {
    name: speaker?.name || profile.full_name || "کاربر میدان",

    handle: profile.handle || speaker?.handle || `user_${profile.id}`,

    subtitle: speaker?.role || profile.headline || "عضو میدان",

    location: profile.location_label || "",

    avatar: speaker?.avatar_url || profile.avatar_url || undefined,

    cover: speaker?.cover_url || profile.cover_url || undefined,

    verified: Boolean(profile.verified),

    verifiedSpeaker: Boolean(speaker?.verified ?? profile.verified_speaker),

    isSpeaker: Boolean(speaker || profile.is_speaker || profile.verified_speaker),

    verifiedOfficial: Boolean(profile.verified_official),
  };

  // The API can answer an unset list meta as `[""]`; treating that as a real
  // entry would render an empty stat row and a bare `#` skill tag.
  const resumeStats = (profile.resume_stats || []).filter((stat) =>
    Boolean(stat && (stat.label || stat.value)),
  );

  const skills = cleanStrings(profile.skills);

  return {
    actorId: profile.id,

    // The account total; a page count, when the API sends one, replaces it.
    narrativeCount: profile.stats?.narratives ?? null,

    accountType: "resume",

    provinceId: profile.province_id,

    cityId: profile.city_id,

    initialTab: "resume",

    identity,

    squareStats: [],

    resumeStats: resumeStats.length
      ? resumeStats.map((stat) =>
          stat.label === "اعتبار هویت"
            ? {
                ...stat,
                value: profile.verified_speaker ? "سخنران" : "غیر رسمی",
              }
            : stat,
        )
      : [
          {
            value: compactFa(narratives),

            label: "روایت منتشرشده",
          },
          {
            value: "فعال",

            label: "وضعیت عضویت",

            tone: "success",
          },
          {
            value: profile.verified_speaker ? "سخنران" : "غیر رسمی",

            label: "اعتبار هویت",
          },
        ],

    schedule: [],

    activity: narrativeItems[0]
      ? mapNarrative(narrativeItems[0])
      : emptyActivity(),

    narratives: narrativeItems.map(mapNarrative),

    narrativePosts: narrativeItems.map((item) =>
      mapNarrativePost(item, identity),
    ),

    replies: replies.map(mapReply),

    about: plainText(speaker?.bio || profile.about || ""),

    skills: skills.length
      ? skills
      : cleanStrings(
          (speaker?.categories || []).map((category) => category.name),
        ),
  };
}
