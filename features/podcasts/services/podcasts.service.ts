import { meydanApi, plainText } from "@/lib/meydan-api";

export type PodcastEpisode = {
  id: string;
  title: string;
  duration: string;
  description: string;
};

type ApiContent = {
  id: number;
  slug?: string;
  title: string;
  excerpt?: string;
  body?: string;
  media_duration?: string;
};

export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  const items = await meydanApi<ApiContent[]>("/content?format=audio");
  return items.map((item) => ({
    id: item.slug || String(item.id),
    title: item.title,
    duration: item.media_duration || "",
    description: item.excerpt || plainText(item.body || ""),
  }));
}
