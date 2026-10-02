import type { Metadata } from "next";
import localFont from "next/font/local";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import "./globals.css";
import "@/features/admin/admin-workspace.css";
import "@/features/media/viewer.css";
import "./black-theme.css";
import "./persian-digits.css";
import "leaflet/dist/leaflet.css";

const iranSans = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-iran-sans",
  display: "swap",
  weight: "100 900",
  fallback: ["sans-serif"],
});

// The UI face is Vazirmatn. Digits stay on IRANSansX, whose "ss02" set shows
// every digit (even Latin ones in data) as a Persian numeral.
const digits = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-digits",
  adjustFontFallback: false,
  fallback: [],
  display: "swap",
  weight: "100 900",
  declarations: [{ prop: "unicode-range", value: "U+0030-0039,U+06F0-06F9,U+0660-0669" }],
});

const vazirArabic = localFont({
  src: "./fonts/Vazirmatn-Arabic.woff2",
  variable: "--font-vazir-arabic",
  adjustFontFallback: false,
  fallback: [],
  display: "swap",
  weight: "100 900",
  declarations: [{ prop: "unicode-range", value: "U+0600-06EF,U+06FA-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC" }],
});

const vazirLatin = localFont({
  src: "./fonts/Vazirmatn-Latin.woff2",
  variable: "--font-vazir-latin",
  adjustFontFallback: false,
  fallback: [],
  display: "swap",
  weight: "100 900",
  declarations: [{ prop: "unicode-range", value: "U+0000-002F,U+003A-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

export const metadata: Metadata = {
  title: "نقش من | شبکه سراسری میادین ایران",
  description: "سامانه اجتماعی، رسانه‌ای و میدانی نقش من",
  applicationName: "نقش من",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${iranSans.variable} ${digits.variable} ${vazirArabic.variable} ${vazirLatin.variable}`} suppressHydrationWarning>
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
