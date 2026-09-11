import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/meydan-session";
import { loginHref } from "@/lib/auth-navigation";

export default async function ChatLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!(await isAuthenticated())) redirect(loginHref("/chat"));
  return children;
}
