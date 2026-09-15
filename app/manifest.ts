import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نقش من | شبکه سراسری میادین ایران",
    short_name: "نقش من",
    description: "سامانه اجتماعی، رسانه‌ای و میدانی نقش من",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
