import { compactFa, meydanApi, plainText } from "@/lib/meydan-api";
import { accessTokenHeader } from "@/lib/meydan-session";
import type { FeedAttachment, FeedPost } from "@/features/feed/types";
import type {
  ProfileDetails,
  ProfileNarrative,
  ProfileReply,
  ProfileStat,
} from "../types";

type ApiSchedule = {
  id: number;
  title: string;
  starts_at: string;
  position?: number;
};

type ApiSquareLocation = {
  address?: string;
  province_id?: number;
  city_id?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
};

type ApiSquare = {
  id: number;
  name: string;
  description?: string;
  verified?: boolean;
  avatar_url?: string;
  cover_url?: string;
  handle?: string;
  subtitle?: string;
  profile_about?: string;
  profile_skills?: string[];
  square_stats?: ProfileStat[];
  resume_stats?: ProfileStat[];
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: ApiSquareLocation | null;
  schedule?: ApiSchedule[];
};

type ApiUserProfile = {
  id: number;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  headline?: string;
  verified?: boolean;
  verified_speaker?: boolean;
  location_label?: string;
  province_id?: number;
  city_id?: number;
  about?: string;
  skills?: string[];
  resume_stats?: ProfileStat[];
  stats?: {
    narratives?: number;
  };
};

type ApiMe =
  | {
      account_type: "square";
      square: ApiSquare | null;
    }
  | {
      account_type: "user";
      profile: ApiUserProfile;
    };

type ApiPublicUser = {
  id: number;
  actor: {
    avatar_url?: string;
    display_name?: string;
    verified?: boolean;
    verified_speaker?: boolean;
  };
  profile: Omit<
    ApiUserProfile,
    "id" | "avatar_url" | "verified"
  >;
};

type ApiNarrative = {
  id: number;

  author?: {
    id?: string;
    type?: "user" | "square";
    display_name?: string;
    avatar_url?: string;
    verified?: boolean;
  };

  body: string;
  published_at?: string | null;
  tags?: string[];

  attachments?: Array<{
    id: number;
    type?: string;
    label?: string;
    filename?: string;
    url?: string;
    width?: number;
    height?: number;
  }>;

  media_reflections?: Array<{
    outlet: string;
    title: string;
    url?: string;
  }>;

  initiative?: {
    id?: number;
    cta_label?: string;
    viewer_state?: {
      joined?: boolean;
    };
  } | null;

  viewer_state?: {
    liked?: boolean;
    reposted?: boolean;
  } | null;

  stats?: {
    likes?: number;
    reposts?: number;
    comments?: number;
    views?: number;
  };
};

type ApiComment = {
  id: number;
  narrative_id: number;
  body: string;
  created_at?: string | null;
};

type ApiMediaReflectionCount = {
  square_id: number;
  count: number;
};

function timeFa(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function relativeFa(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMinutes = Math.max(
    1,
    Math.round(
      (Date.now() - date.getTime()) /
        60000,
    ),
  );

  const number =
    new Intl.NumberFormat("fa-IR");

  if (diffMinutes < 60) {
    return `${number.format(
      diffMinutes,
    )} دقیقه پیش`;
  }

  const hours = Math.round(
    diffMinutes / 60,
  );

  if (hours < 24) {
    return `${number.format(
      hours,
    )} ساعت پیش`;
  }

  return `${number.format(
    Math.round(hours / 24),
  )} روز پیش`;
}

function emptyActivity(): ProfileDetails["activity"] {
  return {
    id: "none",
    authorLabel:
      "ثبت‌شده توسط مسئول موکب",
    timeLabel: "",
    content:
      "هنوز روایتی برای این میدان ثبت نشده است.",
    tags: [],
    likes: 0,
    reposts: 0,
    comments: 0,
  };
}

function mapNarrative(
  activity: ApiNarrative,
): ProfileNarrative {
  return {
    id: String(activity.id),

    authorLabel:
      "ثبت‌شده توسط مسئول میدان",

    timeLabel: relativeFa(
      activity.published_at,
    ),

    content: plainText(
      activity.body || "",
    ),

    tags: activity.tags || [],

    likes:
      activity.stats?.likes || 0,

    reposts:
      activity.stats?.reposts || 0,

    comments:
      activity.stats?.comments || 0,
  };
}

function mapReply(
  item: ApiComment,
): ProfileReply {
  return {
    id: String(item.id),

    narrativeId: String(
      item.narrative_id,
    ),

    content: plainText(
      item.body || "",
    ),

    timeLabel: relativeFa(
      item.created_at,
    ),
  };
}

function attachmentIcon(
  type?: string,
): FeedAttachment["icon"] {
  if (type === "image") {
    return "image";
  }

  if (type === "video") {
    return "video";
  }

  if (type === "audio") {
    return "microphone";
  }

  return "article";
}

function mediaReflectionOutlets(
  reflections: NonNullable<ApiNarrative["media_reflections"]>,
): string[] {
  return Array.from(
    new Set(
      reflections
        .map((reflection) => reflection.outlet?.trim())
        .filter((outlet): outlet is string => Boolean(outlet)),
    ),
  );
}

function mediaReflectionSummary(
  outlets: string[],
): string {
  if (!outlets.length) return "";

  if (outlets.length === 1) {
    return `بازنشر شده در ${outlets[0]}`;
  }

  if (outlets.length === 2) {
    return `بازنشر شده در ${outlets[0]} و ${outlets[1]}`;
  }

  if (outlets.length === 3) {
    return `بازنشر شده در ${outlets[0]}، ${outlets[1]} و ${outlets[2]}`;
  }

  return `بازنشر شده در ${outlets[0]}، ${outlets[1]}، ${outlets[2]} و ${(outlets.length - 3).toLocaleString("fa-IR")} رسانه دیگر`;
}

function mapNarrativePost(
  item: ApiNarrative,
  identity: ProfileDetails["identity"],
): FeedPost {
  const id =
    item.author?.id || "";

  const actorId = Number(
    id.match(
      /(?:sq_|u_)?(\d+)$/,
    )?.[1] || 0,
  );

  const attachments = (
    item.attachments || []
  ).map((attachment) => ({
    id: String(attachment.id),

    label:
      attachment.label ||
      attachment.filename ||
      "پیوست",

    detail:
      attachment.type || "فایل",

    icon: attachmentIcon(
      attachment.type,
    ),

    previewSrc:
      attachment.type === "image" ||
      attachment.type === "video"
        ? attachment.url
        : undefined,

    previewAlt:
      attachment.label ||
      identity.name,

    width:
      attachment.width,

    height:
      attachment.height,
  }));

  const reflections =
    item.media_reflections || [];

  const reflection =
    reflections[0];

  const reflectionOutlets =
    mediaReflectionOutlets(reflections);

  const reflectionSummary =
    mediaReflectionSummary(reflectionOutlets);

  return {
    id: String(item.id),

    author: {
      id: actorId,

      type:
        item.author?.type ||
        "square",

      avatarUrl:
        item.author?.avatar_url ||
        identity.avatar,

      verified: Boolean(
        item.author?.verified ??
          identity.verified,
      ),
    },

    initiativeId:
      item.initiative?.id,

    viewerState: {
      liked: Boolean(
        item.viewer_state?.liked,
      ),

      reposted: Boolean(
        item.viewer_state?.reposted,
      ),

      joined: Boolean(
        item.initiative?.viewer_state
          ?.joined,
      ),
    },

    kind:
      attachments.some(
        (attachment) =>
          attachment.icon === "image" ||
          attachment.icon === "video",
      ) || reflection
        ? "media"
        : "ideas",

    squareName:
      item.author?.display_name ||
      identity.name,

    handle:
      identity.handle,

    timeAgo: relativeFa(
      item.published_at,
    ),

    city:
      identity.location,

    badge:
      item.tags?.[0] ||
      "روایت میدان",

    title:
      item.author?.display_name ||
      identity.name,

    body: plainText(
      item.body || "",
    ),

    attachments,

    mediaReflection: reflection
      ? {
          outlet: reflection.outlet,
          outlets: reflectionOutlets,
          headline: reflectionSummary || reflection.title,
          url:
            reflections.length === 1
              ? reflection.url
              : undefined,
        }
      : undefined,

    stats: {
      likes:
        item.stats?.likes || 0,

      comments:
        item.stats?.comments || 0,

      reposts:
        item.stats?.reposts || 0,

      views:
        item.stats?.views || 0,
    },

    callToAction:
      item.initiative?.cta_label ||
      undefined,
  };
}

function toFiniteNumber(
  value: unknown,
): number | undefined {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function squareCoordinates(
  square: ApiSquare,
): {
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

function mapSquare(
  square: ApiSquare,
  narratives: ApiNarrative[] = [],
  replies: ApiComment[] = [],
  mediaReflectionCount = 0,
): ProfileDetails {
  const mappedNarratives =
    narratives.map(mapNarrative);

  const mappedActivity =
    mappedNarratives[0];

  /*
   * TODO:
   * دو آمار اول فعلاً Mock هستند.
   * تعداد بازتاب رسانه‌ای از API واقعی میدان گرفته می‌شود.
   */
  const squareStats: ProfileStat[] = [
    {
      value: "۱۱ شب",
      label: "تجمع مستمر",
    },
    {
      value: "۴۵ هزار",
      label: "جمعیت امید",
    },
    {
      value: `${compactFa(mediaReflectionCount)} روایت`,
      label: "بازتاب رسانه‌ای",
      tone: "success",
    },
  ];

  const identity = {
    name: square.name,

    handle:
      square.handle ||
      `square_${square.id}`,

    subtitle:
      square.subtitle ||
      "پایگاه فعال میدان",

    location:
      square.location?.address || "",

    avatar:
      square.avatar_url ||
      undefined,

    cover:
      square.cover_url ||
      undefined,

    verified: Boolean(
      square.verified,
    ),
  };

  const coordinates =
    squareCoordinates(square);

  return {
    actorId: square.id,

    accountType: "square",

    provinceId:
      square.location?.province_id,

    cityId:
      square.location?.city_id,

    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,

    initialTab: "square",

    identity,

    squareStats,

    resumeStats:
      square.resume_stats || [],

    schedule: (
      square.schedule || []
    )
      .slice()
      .sort(
        (a, b) =>
          (a.position || 0) -
          (b.position || 0),
      )
      .map((item, index) => ({
        id: String(item.id),

        title:
          item.title,

        time: timeFa(
          item.starts_at,
        ),

        startsAt:
          item.starts_at,

        highlighted:
          index === 1,
      })),

    activity:
      mappedActivity ||
      emptyActivity(),

    narratives:
      mappedNarratives,

    narrativePosts:
      narratives.map((item) =>
        mapNarrativePost(
          item,
          identity,
        ),
      ),

    replies:
      replies.map(mapReply),

    about: plainText(
      square.profile_about ||
        square.description ||
        "",
    ),

    skills:
      square.profile_skills || [],
  };
}

function mapUser(
  profile: ApiUserProfile,
  narrativeItems: ApiNarrative[] = [],
  replies: ApiComment[] = [],
): ProfileDetails {
  const narratives =
    profile.stats?.narratives ||
    narrativeItems.length ||
    0;

  const identity = {
    name:
      profile.full_name ||
      "کاربر میدان",

    handle:
      `user_${profile.id}`,

    subtitle:
      profile.headline ||
      "عضو میدان",

    location:
      profile.location_label || "",

    avatar:
      profile.avatar_url ||
      undefined,

    cover:
      profile.cover_url ||
      undefined,

    verified: Boolean(
      profile.verified,
    ),

    verifiedSpeaker: Boolean(
      profile.verified_speaker,
    ),
  };

  return {
    actorId: profile.id,

    accountType: "resume",

    provinceId:
      profile.province_id,

    cityId:
      profile.city_id,

    initialTab: "resume",

    identity,

    squareStats: [],

    resumeStats:
      profile.resume_stats?.length
        ? profile.resume_stats
        : [
            {
              value:
                compactFa(narratives),

              label:
                "روایت منتشرشده",
            },
            {
              value: "فعال",

              label:
                "وضعیت عضویت",

              tone: "success",
            },
            {
              value:
                profile.verified
                  ? "تأییدشده"
                  : "عادی",

              label:
                "اعتبار هویت",
            },
          ],

    schedule: [],

    activity:
      narrativeItems[0]
        ? mapNarrative(
            narrativeItems[0],
          )
        : emptyActivity(),

    narratives:
      narrativeItems.map(
        mapNarrative,
      ),

    narrativePosts:
      narrativeItems.map(
        (item) =>
          mapNarrativePost(
            item,
            identity,
          ),
      ),

    replies:
      replies.map(mapReply),

    about: plainText(
      profile.about || "",
    ),

    skills:
      profile.skills || [],
  };
}

async function authenticatedProfile(): Promise<ProfileDetails | null> {
  const headers =
    await accessTokenHeader();

  if (!headers.Authorization) {
    return null;
  }

  try {
    const me =
      await meydanApi<ApiMe>(
        "/me",
        {
          headers,
        },
      );

    let narratives:
      ApiNarrative[] = [];

    let replies:
      ApiComment[] = [];

    try {
      narratives =
        await meydanApi<
          ApiNarrative[]
        >("/me/narratives", {
          headers,
        });
    } catch {
      narratives = [];
    }

    const actorId =
      me.account_type === "square"
        ? me.square?.id
        : me.profile.id;

    if (actorId) {
      try {
        replies =
          await meydanApi<
            ApiComment[]
          >(
            `/actors/${me.account_type}/${actorId}/replies`,
            {
              headers,
            },
          );
      } catch {
        replies = [];
      }
    }

    if (
      me.account_type === "user"
    ) {
      return mapUser(
        me.profile,
        narratives,
        replies,
      );
    }

    if (!me.square) {
      return null;
    }

    let mediaReflectionCount = 0;

    try {
      const reflectionStats =
        await meydanApi<ApiMediaReflectionCount>(
          `/squares/${me.square.id}/media-reflections/count`,
        );

      mediaReflectionCount =
        reflectionStats.count ?? 0;
    } catch {
      mediaReflectionCount = 0;
    }

    return mapSquare(
      me.square,
      narratives,
      replies,
      mediaReflectionCount,
    );
  } catch {
    return null;
  }
}

export async function getProfileDetails(): Promise<ProfileDetails> {
  const profile =
    await authenticatedProfile();

  if (!profile) {
    throw new Error(
      "برای مشاهده پروفایل وارد شوید.",
    );
  }

  return profile;
}

export async function getPublicProfileDetails(
  type: "user" | "square",
  id: number,
): Promise<ProfileDetails | null> {
  try {
    if (type === "square") {
      const [
        square,
        narratives,
        replies,
        reflectionStats,
      ] = await Promise.all([
        meydanApi<ApiSquare>(
          `/squares/${id}`,
        ),

        meydanApi<ApiNarrative[]>(
          `/squares/${id}/narratives`,
        ),

        meydanApi<ApiComment[]>(
          `/actors/square/${id}/replies`,
        ),

        meydanApi<ApiMediaReflectionCount>(
          `/squares/${id}/media-reflections/count`,
        ).catch(() => ({
          square_id: id,
          count: 0,
        })),
      ]);

      return mapSquare(
        square,
        narratives,
        replies,
        reflectionStats.count,
      );
    }

    const [
      user,
      narratives,
      replies,
    ] = await Promise.all([
      meydanApi<ApiPublicUser>(
        `/users/${id}`,
      ),

      meydanApi<ApiNarrative[]>(
        `/users/${id}/narratives`,
      ),

      meydanApi<ApiComment[]>(
        `/actors/user/${id}/replies`,
      ),
    ]);

    return mapUser(
      {
        id: user.id,

        ...user.profile,

        full_name:
          user.profile.full_name ||
          user.actor.display_name ||
          "کاربر میدان",

        avatar_url:
          user.actor.avatar_url,

        verified:
          user.actor.verified,

        verified_speaker:
          user.actor.verified_speaker,
      },

      narratives,

      replies,
    );
  } catch {
    return null;
  }
}
