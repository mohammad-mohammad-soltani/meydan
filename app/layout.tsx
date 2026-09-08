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

export const metadata: Metadata = { title: "میدانِ خیابان | شبکه سراسری میادین ایران", description: "سامانه اجتماعی، رسانه‌ای و میدانی میدانِ خیابان" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`dark ${iranSans.variable}`}>
      <body className="bg-white dark:bg-[#070a0f] min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
