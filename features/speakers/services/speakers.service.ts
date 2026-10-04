import { meydanApi, meydanApiEnvelope } from "@/lib/meydan-api";
import { loadSpeakerCityNames } from "./city-names";
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
  cities?: Array<{ id?: number | string; name?: string } | string | number>;
  user_id?: number | null;
  categories?: ApiCategory[];
};

const accents: Speaker["accent"][] = ["slate", "blue", "amber", "emerald"];

function categoriesOf(item: ApiSpeaker): SpeakerCategory[] {
  return (item.categories || [])
    .filter((category): category is { slug: string; name?: string } => Boolean(category?.slug))
    .map((category) => ({ slug: String(category.slug), name: String(category.name || category.slug) }));
}

function cityNames(cities: ApiSpeaker["cities"], names: Map<string, string>): string[] {
  return (cities || [])
    .map((city) => (typeof city === "object" ? city.name || String(city.id ?? "") : String(city)))
    .map((name) => /^\d+$/.test(name) ? names.get(name) || "" : name)
    .filter(Boolean);
}

/** Admin-editable category list, so the filter row stays in sync without a deploy. */
export async function getSpeakerCategories(): Promise<SpeakerCategory[]> {
  const items = await meydanApi<ApiCategory[]>("/speaker-categories");
  return (items || [])
    .filter((item): item is { slug: string; name?: string } => Boolean(item?.slug))
    .map((item) => ({ slug: String(item.slug), name: String(item.name || item.slug) }));
}

export type SpeakerPage = { items: Speaker[]; page: number; total: number; pages: number };

export async function getSpeakerPage(page = 1, q = "", category = "all"): Promise<SpeakerPage> {
  const params = new URLSearchParams({ page: String(page), per_page: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (category !== "all") params.set("speaker_category", category);
  const response = await meydanApiEnvelope<ApiSpeaker[]>(`/speakers?${params}`);
  const items = response.data ?? [];
  const needsNames = items.some((item) => item.cities?.some((city) => typeof city === "number" || (typeof city === "string" && /^\d+$/.test(city)) || (typeof city === "object" && !city.name && city.id != null)));
  const names = needsNames ? await loadSpeakerCityNames().catch(() => new Map<string, string>()) : new Map<string, string>();
  return { items: items.map((item, index) => ({
    id: String(item.id),
    name: item.name,
    handle: item.handle || item.slug || `speaker_${item.id}`,
    cities: cityNames(item.cities, names),
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
  })), page: Number(response.meta.page ?? page), total: Number(response.meta.total ?? items.length), pages: Number(response.meta.pages ?? 1) };
}
