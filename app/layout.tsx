import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, TWITTER_SITE_HANDLE } from "@/lib/seo";
import "./globals.css";
import "@/features/admin/admin-workspace.css";
import "@/features/media/viewer.css";
import "./black-theme.css";
import "./reference-tokens.css";
import "./persian-digits.css";
import "leaflet/dist/leaflet.css";

const iranSans = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-iran-sans",
  display: "swap",
  weight: "100 900",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: ["نقش من", "میدان", "شبکه اجتماعی ایران", "روایت", "سخنرانان", "محتوا", "پادکست"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  // No blanket canonical here: Next.js metadata is inherited by any page that
  // doesn't set its own, so a fixed "/" would wrongly claim every page as a
  // duplicate of the homepage. Each indexable page sets its own canonical.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary",
    site: TWITTER_SITE_HANDLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  formatDetection: { telephone: false },
  other: process.env.GOOGLE_SITE_VERIFICATION
    ? { "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={iranSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(() => {\n  try {\n    const stored = window.localStorage.getItem(\"meydan-theme\");\n    const theme = stored === \"light\" || stored === \"black\" ? stored : \"dark\";\n    document.documentElement.classList.toggle(\"dark\", theme === \"dark\");\n    document.documentElement.classList.toggle(\"black\", theme === \"black\");\n    document.documentElement.style.colorScheme = theme === \"light\" ? \"light\" : \"dark\";\n  } catch {\n    document.documentElement.classList.add(\"dark\");\n    document.documentElement.classList.remove(\"black\");\n    document.documentElement.style.colorScheme = \"dark\";\n  }\n})();" }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground transition-colors duration-150">
        <PwaRuntime />
        {children}
      </body>
    </html>
  );
}
