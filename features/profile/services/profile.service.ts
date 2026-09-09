import { compactFa, meydanApi } from "@/lib/meydan-api";
import type { ProfileDetails } from "../types";

type ApiSchedule = { id: number; title: string; starts_at: string; position?: number };
type ApiSquare = {
  id: number;
  name: string;
  description: string;
  verified: boolean;
  handle?: string;
  subtitle?: string;
  profile_about?: string;
  profile_skills?: string[];
  square_stats?: ProfileDetails["squareStats"];
  resume_stats?: ProfileDetails["resumeStats"];
  location?: { address?: string } | null;
  schedule?: ApiSchedule[];
};
type ApiNarrative = {
  id: number;
  body: string;
  published_at?: string | null;
  tags?: string[];
  stats?: { likes?: number; reposts?: number; comments?: number };
};

function timeFa(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function relativeFa(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${new Intl.NumberFormat("fa-IR").format(diffMinutes)} دقیقه پیش`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${new Intl.NumberFormat("fa-IR").format(hours)} ساعت پیش`;
  return `${new Intl.NumberFormat("fa-IR").format(Math.round(hours / 24))} روز پیش`;
}

export async function getProfileDetails(): Promise<ProfileDetails> {
  const squares = await meydanApi<ApiSquare[]>("/squares?q=" + encodeURIComponent("پایگاه میدان انقلاب تهران"));
  const square = squares[0];
  if (!square) throw new Error("پروفایل میدان در WordPress پیدا نشد.");

  const narratives = await meydanApi<ApiNarrative[]>(`/squares/${square.id}/narratives`);
  const activity = narratives[0];

  return {
    identity: {
      name: square.name,
      handle: square.handle || `square_${square.id}`,
      subtitle: square.subtitle || "پایگاه فعال میدان",
      location: square.location?.address || "",
      avatar: "🏛️",
      verified: square.verified,
    },
    squareStats: square.square_stats?.length
      ? square.square_stats
      : [
          { value: compactFa(narratives.length), label: "روایت منتشرشده" },
          { value: compactFa(activity?.stats?.likes || 0), label: "پسند آخرین روایت" },
          { value: compactFa(activity?.stats?.comments || 0), label: "گفتگو", tone: "success" },
        ],
    resumeStats: square.resume_stats?.length
      ? square.resume_stats
      : [
          { value: compactFa(narratives.length), label: "فعالیت ثبت‌شده" },
          { value: "فعال", label: "وضعیت پایگاه", tone: "success" },
          { value: square.verified ? "تأییدشده" : "در انتظار", label: "اعتبار هویت" },
        ],
    schedule: (square.schedule || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((item, index) => ({
        id: String(item.id),
        title: item.title,
        time: timeFa(item.starts_at),
        highlighted: index === 1,
      })),
    activity: {
      id: activity ? String(activity.id) : "none",
      authorLabel: "ثبت‌شده توسط مسئول موکب",
      timeLabel: relativeFa(activity?.published_at),
      content: activity?.body || "هنوز روایتی برای این میدان ثبت نشده است.",
      tags: activity?.tags || [],
      likes: activity?.stats?.likes || 0,
      reposts: activity?.stats?.reposts || 0,
      comments: activity?.stats?.comments || 0,
    },
    about: square.profile_about || square.description || "",
    skills: square.profile_skills || [],
  };
}
