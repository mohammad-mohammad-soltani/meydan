import { meydanApi } from "@/lib/meydan-api";
import type { Speaker, SpeakerCategory } from "../types";

type ApiCategory = { slug?: string; name?: string };

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
  user_id?: number | null;
  categories?: ApiCategory[];
};

const accents: Speaker["accent"][] = ["slate", "blue", "amber", "emerald"];

function categoriesOf(item: ApiSpeaker): SpeakerCategory[] {
  return (item.categories || [])
    .filter((category): category is { slug: string; name?: string } => Boolean(category?.slug))
    .map((category) => ({ slug: String(category.slug), name: String(category.name || category.slug) }));
}

function cityNames(cities?: ApiSpeaker["cities"]): string[] {
  return (cities || [])
    .map((city) => (typeof city === "string" ? city : city.name || ""))
    .filter(Boolean);
}

/** Admin-editable category list, so the filter row stays in sync without a deploy. */
export async function getSpeakerCategories(): Promise<SpeakerCategory[]> {
  const items = await meydanApi<ApiCategory[]>("/speaker-categories");
  return (items || [])
    .filter((item): item is { slug: string; name?: string } => Boolean(item?.slug))
    .map((item) => ({ slug: String(item.slug), name: String(item.name || item.slug) }));
}

export async function getSpeakers(): Promise<Speaker[]> {
  const items = await meydanApi<ApiSpeaker[]>("/speakers");
  return items.map((item, index) => ({
    id: String(item.id),
    name: item.name,
    handle: item.handle || item.slug || `speaker_${item.id}`,
    cities: cityNames(item.cities),
    categories: categoriesOf(item),
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
    userId: item.user_id ? String(item.user_id) : undefined,
  }));
}
