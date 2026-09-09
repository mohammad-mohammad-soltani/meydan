import { meydanApi } from "@/lib/meydan-api";
import type { Speaker, SpeakerCategory } from "../types";

type ApiSpeaker = {
  id: number;
  slug?: string;
  name: string;
  role?: string;
  bio?: string;
  verified?: boolean;
  handle?: string;
  expertise?: string;
  initials?: string;
  avatar_url?: string;
  cities?: Array<{ name?: string } | string>;
};

const accents: Speaker["accent"][] = ["slate", "blue", "amber", "emerald"];

function categoryOf(item: ApiSpeaker): SpeakerCategory {
  const text = `${item.role || ""} ${item.expertise || ""} ${item.bio || ""}`;
  if (/رسانه|شناختی|ارتباط/.test(text)) return "media";
  if (/مقاومت|تمدن|اجتماعی/.test(text)) return "resistance";
  return "faith";
}

function cityNames(cities?: ApiSpeaker["cities"]): string[] {
  return (cities || [])
    .map((city) => (typeof city === "string" ? city : city.name || ""))
    .filter(Boolean);
}

export async function getSpeakers(): Promise<Speaker[]> {
  const items = await meydanApi<ApiSpeaker[]>("/speakers");
  return items.map((item, index) => ({
    id: String(item.id),
    name: item.name,
    handle: item.handle || item.slug || `speaker_${item.id}`,
    cities: cityNames(item.cities),
    category: categoryOf(item),
    expertise: item.expertise || item.bio || item.role || "",
    initials:
      item.initials ||
      item.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join("."),
    avatarUrl: item.avatar_url,
    accent: accents[index % accents.length],
    verified: Boolean(item.verified),
  }));
}
