import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/home", destination: "/" },
      { source: "/content", destination: "/" },
      { source: "/speakers", destination: "/" },
      { source: "/map", destination: "/" },
      { source: "/chat", destination: "/" },
      { source: "/profile", destination: "/" },
      { source: "/compose", destination: "/" },
      { source: "/post", destination: "/" },
      { source: "/direct-chat", destination: "/" },
      { source: "/podcasts", destination: "/" },
    ];
  },
};

export default nextConfig;
