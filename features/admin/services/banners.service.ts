import type { ContentBanner } from "@/features/content/services/banners.service";
import { adminGetItem, adminPut } from "./admin-api";

export function getAdminBanners(init?: RequestInit): Promise<ContentBanner[]> {
  return adminGetItem("/admin/content/banners", init);
}

export function saveAdminBanners(banners: ContentBanner[]): Promise<ContentBanner[]> {
  return adminPut("/admin/content/banners", {
    banners: banners.map(({ id, media_id, title, href, enabled }) => ({
      id, media_id, title: title.trim(), href: href.trim(), enabled,
    })),
  });
}
