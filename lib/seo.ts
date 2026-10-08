/** Canonical production origin, used to build absolute URLs for metadata, sitemaps and JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://naghshman.ir").replace(/\/+$/, "");

export const SITE_NAME = "نقش من";
export const SITE_TITLE = "نقش من | شبکه سراسری میادین ایران";
export const SITE_DESCRIPTION = "سامانه اجتماعی، رسانه‌ای و میدانی نقش من؛ شبکه سراسری میادین، روایت‌ها، محتوا و سخنرانان ایران.";

/**
 * Default social preview image, used when a page has no richer image of its own.
 * X/Facebook/Telegram crawlers don't render SVG `og:image`s, so this points at the
 * raster app icon instead of the SVG mark.
 */
export const DEFAULT_OG_IMAGE = { url: "/apple-icon.png", width: 180, height: 180, alt: SITE_NAME };

export const TWITTER_SITE_HANDLE = "@naghshman_ir";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Strips tags/whitespace and clamps length for use as an OG/Twitter/meta description. */
export function toDescription(value: string | null | undefined, max = 180): string {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return SITE_DESCRIPTION;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

/** `BreadcrumbList` JSON-LD for a trail of `{ name, path }` crumbs (paths relative to the site root). */
export function breadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
