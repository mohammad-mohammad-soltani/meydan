import type { NextConfig } from "next";

type RemoteImagePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

/** Keep external image patterns path-scoped to the media locations we own. */
const UPLOAD_PATH = "/wp-content/uploads/**";
const ARVAN_MEDIA_HOST = "naghshman-media.s3.ir-thr-at1.arvanstorage.ir";
const ARVAN_MEDIA_PATH = "/production/**";

/**
 * Backends this app has been deployed against.
 *
 * These matter because optimized thumbnails make the *Next server* fetch the
 * upload, not the visitor's browser, so the optimizer must already trust the
 * host or it answers `400` and the card breaks.
 */
const KNOWN_UPLOAD_PATTERNS: RemoteImagePatterns = [
  { protocol: "http", hostname: "localhost", pathname: UPLOAD_PATH },
  { protocol: "http", hostname: "127.0.0.1", pathname: UPLOAD_PATH },
  { protocol: "https", hostname: "naghshman.ir", pathname: UPLOAD_PATH },
  { protocol: "https", hostname: "**.naghshman.ir", pathname: UPLOAD_PATH },
  { protocol: "https", hostname: "nabzjahan.ir", pathname: UPLOAD_PATH },
  { protocol: "https", hostname: "**.nabzjahan.ir", pathname: UPLOAD_PATH },
  {
    protocol: "https",
    hostname: ARVAN_MEDIA_HOST,
    pathname: ARVAN_MEDIA_PATH,
  },
];

/**
 * The configured API base is the one input that moves between environments, so
 * its origin is trusted for uploads as well. Leave the port unset: the pattern
 * then matches any port, which is what a local WordPress needs.
 */
function configuredUploadPatterns(): RemoteImagePatterns {
  const patterns: RemoteImagePatterns = [];
  const bases = [process.env.MEYDAN_API_BASE_URL, process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL];

  for (const base of bases) {
    if (!base) continue;

    try {
      const { protocol, hostname } = new URL(base);
      if (protocol !== "http:" && protocol !== "https:") continue;
      patterns.push({
        protocol: protocol === "http:" ? "http" : "https",
        hostname,
        pathname: UPLOAD_PATH,
      });
    } catch {
      // A malformed base simply contributes no pattern.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Clickjacking only: a full script-src CSP would need nonces for the inline theme bootstrap.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // «کارها» now lives inside the chat page; old links (and backend notification deep links) keep working.
      { source: "/works", destination: "/chat", permanent: false },
      { source: "/works/:id(\\d+)", destination: "/chat/work/:id", permanent: false },
      {
        // Notifications created before the invitation page existed stored a
        // per-request deep link (`/speaker-requests/{id}`) that never had a
        // matching route. Those rows are already in the database, so redirect
        // them to the page that now lists them instead of returning 404.
        source: "/speaker-requests/:path*",
        destination: "/speaker-invitations",
        permanent: false,
      },
    ];
  },
  images: {
    /** Leaflet renders 42px pins; 84px keeps them sharp on 2x displays. */
    imageSizes: [16, 32, 48, 64, 84, 96, 128, 256, 384],
    remotePatterns: [
      ...KNOWN_UPLOAD_PATTERNS,
      ...configuredUploadPatterns(),
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/avatar/**",
      },
    ],
    /**
     * `60` is the timeline/avatar quality (`MEDIA_THUMB_QUALITY`); `75` stays
     * because it is the default every other `next/image` in the app uses.
     */
    qualities: [60, 75],
    /** One upload URL never changes content, so variants are worth keeping. */
    minimumCacheTTL: 60 * 60 * 24 * 7,
    /** Development API base is a local WordPress, which resolves to a private IP. */
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
