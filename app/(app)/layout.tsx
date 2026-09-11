import type { ReactNode } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const authenticated = await isAuthenticated();

  return (
    <AudioProvider>
      <AppShell isAuthenticated={authenticated}>{children}</AppShell>
    </AudioProvider>
  );
}
