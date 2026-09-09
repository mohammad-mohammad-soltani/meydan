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
};

const accents: Speaker["accent"][] = ["slate", "blue", "amber", "emerald"];

function categoryOf(item: ApiSpeaker): SpeakerCategory {
  const text = `${item.role || ""} ${item.expertise || ""}`;
  if (/رسانه|شناختی|ارتباط/.test(text)) return "media";
  if (/مقاومت|تمدن|اجتماعی/.test(text)) return "resistance";
  return "faith";
}

export async function getSpeakers(): Promise<Speaker[]> {
  const items = await meydanApi<ApiSpeaker[]>("/speakers");
  return items.map((item, index) => ({
    id: String(item.id),
    name: item.name,
    handle: item.handle || item.slug || `speaker_${item.id}`,
    cities: [],
    category: categoryOf(item),
    expertise: item.expertise || item.bio || item.role || "",
    initials: item.initials || item.name.split(/\s+/).slice(-2).map((x) => x[0]).join("."),
    accent: accents[index % accents.length],
    verified: Boolean(item.verified),
  }));
}
