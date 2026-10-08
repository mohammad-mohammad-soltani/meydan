import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getContentItems } from "@/features/content/services/content.service";
import { getSpeakerPage } from "@/features/speakers/services/speakers.service";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/home", priority: 0.9, changeFrequency: "hourly" },
  { path: "/explore", priority: 0.8, changeFrequency: "hourly" },
  { path: "/map", priority: 0.6, changeFrequency: "daily" },
  { path: "/speakers", priority: 0.7, changeFrequency: "daily" },
  { path: "/podcasts", priority: 0.6, changeFrequency: "daily" },
  { path: "/videos", priority: 0.6, changeFrequency: "daily" },
  { path: "/content", priority: 0.7, changeFrequency: "daily" },
  { path: "/content/audio", priority: 0.5, changeFrequency: "daily" },
  { path: "/content/speeches", priority: 0.5, changeFrequency: "daily" },
  { path: "/content/music-videos", priority: 0.5, changeFrequency: "daily" },
  { path: "/initiatives", priority: 0.5, changeFrequency: "daily" },
];

async function speakerHandles(): Promise<string[]> {
  try {
    const handles = new Set<string>();
    let page = 1;
    for (;;) {
      const result = await getSpeakerPage(page);
      for (const item of result.items) if (item.handle) handles.add(item.handle);
      if (page >= result.pages || result.items.length === 0) break;
      page += 1;
    }
    return [...handles];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [content, handles] = await Promise.all([
    getContentItems().catch(() => []),
    speakerHandles(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const contentEntries: MetadataRoute.Sitemap = content.map((item) => ({
    url: `${SITE_URL}/content/${item.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const profileEntries: MetadataRoute.Sitemap = handles.map((handle) => ({
    url: `${SITE_URL}/${handle}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...contentEntries, ...profileEntries];
}
