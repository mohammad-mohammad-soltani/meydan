import { generatedMedia } from "@/components/shared/generated-media";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import type { ProfileIdentity } from "../types";

export function ProfileHeader({ identity }: { identity: ProfileIdentity }) {
  return (
    <>
      <div className="relative h-28 overflow-hidden bg-gradient-to-r from-brand via-surface-elevated to-solid-dark">
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-scrim px-2.5 py-1 text-[11px] text-on-solid backdrop-blur-sm"><span className="h-2 w-2 rounded-full bg-success" />هویت و پایگاه تاییدشده</span>
      </div>
      <div className="relative px-4">
        <Image src={generatedMedia.avatarCoordinator} alt="" width={64} height={64} className="absolute -top-8 right-4 h-16 w-16 rounded-full border-2 border-surface object-cover shadow-card" />
        <div className="pt-11">
          <div className="flex items-center gap-1"><h1 className="text-base font-black text-foreground">{identity.name}</h1>{identity.verified ? <BadgeCheck className="h-4 w-4 fill-verified text-on-solid" /> : null}</div>
          <p className="mt-1 text-xs text-foreground-subtle"><span dir="ltr">@{identity.handle}</span> · {identity.subtitle}</p>
        </div>
      </div>
    </>
  );
}
