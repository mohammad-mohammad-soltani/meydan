import type { Metadata } from "next";
import localFont from "next/font/local";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
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
  title: "نقش من | شبکه سراسری میادین ایران",
  description: "سامانه اجتماعی، رسانه‌ای و میدانی نقش من",
  applicationName: "نقش من",
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
