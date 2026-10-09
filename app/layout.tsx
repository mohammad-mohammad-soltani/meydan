import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import { SplashScreen } from "@/components/pwa/SplashScreen";
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
        {/*
          Rendered server-side so it covers the page before any script runs,
          so there is no flash of app content on every real document load —
          a typed URL, a new tab, or a refresh. Next.js never remounts the
          root layout for a client-side navigation between pages, so this
          effectively never reappears there; no "already shown" flag needed.
          Mobile only: below the app's `lg` breakpoint (1024px). A CSS rule in
          globals.css hides it on desktop before first paint, and neither the
          preload below nor `SplashScreen` fetches the Lottie there.
          `SplashScreen` plays the Lottie, then fades this out (opacity +
          a slight scale-up, over 450ms — see `FADE_OUT_MS` in
          SplashScreen.tsx) before setting `display: none`, never
          `.remove()`: the node is React's, and deleting it behind React's
          back would desync its fiber tree from the real DOM, crashing the
          next reconciliation (e.g. a route change) with a `removeChild`
          error.
        */}
        <div
          id="meydan-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--background)",
            // Only `transition` is set here, never `opacity`/`transform` themselves
            // (those stay at their CSS initial values, 1 and none) — SplashScreen
            // sets those directly via the DOM when fading out, and this way React
            // never has a stale value of its own to reassert over that fade.
            transition: "opacity 450ms ease, transform 450ms ease",
          }}
        >
          {/*
            Capped to the app's own content column (matches the offline
            overlay's `max-w-xl`) instead of the raw viewport: on a wide
            desktop window this keeps the portrait Lottie at a sane size
            instead of "xMidYMid slice" (cover) crushing it down to a
            crop of its vertical center to fill the whole wide screen.
          */}
          <div style={{ width: "100%", height: "100%", maxWidth: 576, margin: "0 auto" }}>
            <div id="meydan-splash-anim" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        {/*
          Starts the ~0.5MB Lottie JSON download the instant the HTML is
          parsed (well before the JS bundle loads and SplashScreen mounts),
          so the animation has as little to wait on as possible.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(() => {\n  try {\n    if (window.matchMedia(\"(min-width: 1024px)\").matches) return;\n    const theme = window.localStorage.getItem(\"meydan-theme\");\n    const src = theme === \"light\" ? \"/splash/splash-light.json\" : \"/splash/splash-dark.json\";\n    const link = document.createElement(\"link\");\n    link.rel = \"preload\";\n    link.as = \"fetch\";\n    link.href = src;\n    link.crossOrigin = \"anonymous\";\n    document.head.appendChild(link);\n  } catch {}\n})();",
          }}
        />
        <PwaRuntime />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
