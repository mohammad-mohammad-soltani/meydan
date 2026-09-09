import type { ReactNode } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { AudioProvider } from "@/features/audio/AudioProvider";

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AudioProvider>
      <AppShell>{children}</AppShell>
    </AudioProvider>
  );
}
