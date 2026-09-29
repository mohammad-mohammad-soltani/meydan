import { meydanApi } from "@/lib/meydan-api";

export type ContentBanner = {
  id: string;
  media_id: number | null;
  image_url: string | null;
  title: string;
  href: string;
  enabled: boolean;
};

export async function getContentBanners(): Promise<ContentBanner[]> {
  try {
    return await meydanApi<ContentBanner[]>("/content/banners", { cache: "no-store" });
  } catch {
    // Banners are optional; the rest of the content page must remain available.
    return [];
  }
}
