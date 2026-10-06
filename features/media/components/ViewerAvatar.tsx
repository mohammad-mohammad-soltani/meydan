"use client";

import { UserRound } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { useDrawerViewer } from "@/components/layouts/useDrawerViewer";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";

/** The signed-in viewer's own avatar (or initial), for comment composers. */
export function ViewerAvatar({ size, className = "" }: { size: number; className?: string }) {
  const { isAuthenticated } = useAuthGate();
  const viewer = useDrawerViewer(isAuthenticated);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-extrabold text-white ${className}`}
      style={{ width: size, height: size }}
    >
      {viewer?.avatarUrl ? (
        <OptimizedAvatar src={viewer.avatarUrl} alt="" width={size} className="h-full w-full object-cover" />
      ) : viewer ? (
        viewer.name.charAt(0)
      ) : (
        <UserRound className="h-4 w-4" />
      )}
    </span>
  );
}
