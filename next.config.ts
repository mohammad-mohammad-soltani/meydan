import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  async redirects() {
    return [
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/avatar/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8082",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
