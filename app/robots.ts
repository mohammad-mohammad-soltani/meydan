import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth",
          "/direct-chat",
          "/chat",
          "/compose",
          "/drafts",
          "/bookmarks",
          "/admin",
          "/screening",
          "/bistcall",
          "/speaker-invitations",
          "/speaker-signup",
          "/profile/edit",
          "/profile/schedule",
          // Legacy id-based addresses redirect to `/{handle}`; keep crawlers off the old form.
          "/profile/*/*",
          "/users/*/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
