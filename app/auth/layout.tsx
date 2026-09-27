import type { ReactNode } from "react";
import { headers } from "next/headers";
import { BottomNavigation } from "@/components/layouts/BottomNavigation";
import { PushIdentityCleanup } from "@/components/pwa/PushIdentityCleanup";
import { AuthReturnToCapture } from "@/components/providers/AuthReturnToBridge";
import { isAuthenticated } from "@/lib/meydan-session";
import { isNaghshmanNativeClient } from "@/lib/native-client";

export default async function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  const authenticated = await isAuthenticated();
  const nativeClient = isNaghshmanNativeClient((await headers()).get("user-agent"));

  return (
    <div className={`relative min-h-[100dvh] ${!nativeClient || authenticated ? "pb-16" : ""}`}>
      <AuthReturnToCapture />
      {!authenticated ? <PushIdentityCleanup /> : null}
      {children}
      {!nativeClient || authenticated ? (
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
          <BottomNavigation isAuthenticated={authenticated} />
        </div>
      ) : null}
    </div>
  );
}
