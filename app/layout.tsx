import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const iranSans = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-iran-sans",
  display: "swap",
  weight: "100 900",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "میدانِ خیابان | شبکه سراسری میادین ایران",
  description: "سامانه اجتماعی، رسانه‌ای و میدانی میدانِ خیابان",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={iranSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(() => {\n  try {\n    const theme = window.localStorage.getItem(\"meydan-theme\");\n    const isDark = theme !== \"light\";\n    document.documentElement.classList.toggle(\"dark\", isDark);\n    document.documentElement.style.colorScheme = isDark ? \"dark\" : \"light\";\n  } catch {\n    document.documentElement.classList.add(\"dark\");\n    document.documentElement.style.colorScheme = \"dark\";\n  }\n})();" }} />
      </head>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
