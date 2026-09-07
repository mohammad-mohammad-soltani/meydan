import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "میدانِ خیابان | شبکه سراسری میادین ایران", description: "سامانه اجتماعی، رسانه‌ای و میدانی میدانِ خیابان" };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="fa" dir="rtl" className="dark"><body>{children}</body></html>}
