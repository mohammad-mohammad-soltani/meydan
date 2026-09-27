import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/layouts/AppShell";
import { AuthGateProvider } from "@/components/providers/AuthGateProvider";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { VideoFeedProvider } from "@/features/media/components/VideoFeedProvider";
import { isAuthenticated } from "@/lib/meydan-session";
import { isNaghshmanNativeClient } from "@/lib/native-client";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const authenticated = await isAuthenticated();
  const nativeClient = isNaghshmanNativeClient((await headers()).get("user-agent"));

  return (
    <AuthGateProvider isAuthenticated={authenticated}>
      <VideoFeedProvider>
        <AudioProvider>
          <AppShell isAuthenticated={authenticated} isNativeClient={nativeClient}>
            {children}
          </AppShell>
        </AudioProvider>
      </VideoFeedProvider>
    </AuthGateProvider>
  );
}
