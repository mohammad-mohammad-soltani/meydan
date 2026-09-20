import type { ReactNode } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { AuthGateProvider } from "@/components/providers/AuthGateProvider";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { VideoFeedProvider } from "@/features/media/components/VideoFeedProvider";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const authenticated = await isAuthenticated();

  return (
    <AuthGateProvider isAuthenticated={authenticated}>
      <VideoFeedProvider>
        <AudioProvider>
          <AppShell isAuthenticated={authenticated}>{children}</AppShell>
        </AudioProvider>
      </VideoFeedProvider>
    </AuthGateProvider>
  );
}
