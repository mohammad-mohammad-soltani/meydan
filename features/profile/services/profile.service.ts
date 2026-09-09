import { compactFa, plainText } from "@/lib/meydan-api";
import { meydanAuthenticatedApi } from "@/lib/meydan-server-api";
import type { ProfileDetails, ProfileStat } from "../types";

type ApiSchedule = {
  id: number;
  title: string;
  starts_at: string;
  position?: number;
};

type ApiSquare = {
  id: number;
  name: string;
  description?: string;
  verified?: boolean;
  handle?: string;
  subtitle?: string;
  profile_about?: string;
  profile_skills?: string[];
  square_stats?: ProfileStat[];
  resume_stats?: ProfileStat[];
  location?: { address?: string } | null;
  schedule?: ApiSchedule[];
};

type ApiUserProfile = {
  id: number;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  verified?: boolean;
  location_label?: string;
  about?: string;
  skills?: string[];
  resume_stats?: ProfileStat[];
  stats?: { narratives?: number };
};

type ApiMe =
  | { account_type: "square"; square: ApiSquare | null }
  | { account_type: "user"; profile: ApiUserProfile };

type ApiNarrative = {
  id: number;
  body: string;
  published_at?: string | null;
  tags?: string[];
  stats?: { likes?: number; reposts?: number; comments?: number };
  viewer_state?: { liked?: boolean; reposted?: boolean } | null;
};

function timeFa(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function relativeFa(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  const number = new Intl.NumberFormat("fa-IR");
  if (diffMinutes < 60) return `${number.format(diffMinutes)} دقیقه پیش`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${number.format(hours)} ساعت پیش`;
  return `${number.format(Math.round(hours / 24))} روز پیش`;
}

function emptyActivity(): ProfileDetails["activity"] {
  return {
    id: "none",
    authorLabel: "ثبت‌شده توسط مسئول موکب",
    timeLabel: "",
    content: "هنوز روایتی برای این میدان ثبت نشده است.",
    tags: [],
    likes: 0,
    reposts: 0,
    comments: 0,
    viewerState: { liked: false, reposted: false },
  };
}

function mapSquare(square: ApiSquare, narratives: ApiNarrative[] = []): ProfileDetails {
  const activity = narratives[0];
  const squareStats = square.square_stats?.length
    ? square.square_stats
    : [
        { value: compactFa(narratives.length), label: "روایت منتشرشده" },
        { value: compactFa(activity?.stats?.likes || 0), label: "پسند آخرین روایت" },
        { value: compactFa(activity?.stats?.comments || 0), label: "گفتگو", tone: "success" as const },
      ];

  return {
    initialTab: "square",
    identity: {
      name: square.name,
      handle: square.handle || `square_${square.id}`,
      subtitle: square.subtitle || "پایگاه فعال میدان",
      location: square.location?.address || "",
      avatar: "🏛️",
      verified: Boolean(square.verified),
    },
    squareStats,
    resumeStats: square.resume_stats || [],
    schedule: (square.schedule || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((item, index) => ({
        id: String(item.id),
        title: item.title,
        time: timeFa(item.starts_at),
        highlighted: index === 1,
      })),
    activity: activity
      ? {
          id: String(activity.id),
          authorLabel: "ثبت‌شده توسط مسئول موکب",
          timeLabel: relativeFa(activity.published_at),
          content: plainText(activity.body || ""),
          tags: activity.tags || [],
          likes: activity.stats?.likes || 0,
          reposts: activity.stats?.reposts || 0,
          comments: activity.stats?.comments || 0,
          viewerState: {
            liked: Boolean(activity.viewer_state?.liked),
            reposted: Boolean(activity.viewer_state?.reposted),
          },
        }
      : emptyActivity(),
    about: plainText(square.profile_about || square.description || ""),
    skills: square.profile_skills || [],
  };
}

function mapUser(profile: ApiUserProfile): ProfileDetails {
  const narratives = profile.stats?.narratives || 0;
  return {
    initialTab: "resume",
    identity: {
      name: profile.full_name || "کاربر میدان",
      handle: `user_${profile.id}`,
      subtitle: profile.headline || "عضو میدان",
      location: profile.location_label || "",
      avatar: profile.avatar_url || "👤",
      verified: Boolean(profile.verified),
    },
    squareStats: [],
    resumeStats: profile.resume_stats?.length
      ? profile.resume_stats
      : [
          { value: compactFa(narratives), label: "روایت منتشرشده" },
          { value: "فعال", label: "وضعیت عضویت", tone: "success" },
          { value: profile.verified ? "تأییدشده" : "عادی", label: "اعتبار هویت" },
        ],
    schedule: [],
    activity: emptyActivity(),
    about: plainText(profile.about || ""),
    skills: profile.skills || [],
  };
}

export async function getProfileDetails(): Promise<ProfileDetails> {
  const me = await meydanAuthenticatedApi<ApiMe>("/me");
  if (me.account_type === "user") return mapUser(me.profile);
  if (!me.square) throw new Error("پایگاه این حساب در بک‌اند پیدا نشد.");
  const narratives = await meydanAuthenticatedApi<ApiNarrative[]>("/me/narratives").catch(() => []);
  return mapSquare(me.square, narratives);
}
