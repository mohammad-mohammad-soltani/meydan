"use client";

import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";

export type ViewerState = { liked: boolean; bookmarked: boolean };

/**
 * The signed-in viewer's like / bookmark state for some content. Lists and pages are rendered from public,
 * cached reads, so the personal state is fetched once on the client and layered on top.
 */
export function useViewerStates(ids: number[]): Record<string, ViewerState> {
  const { isAuthenticated } = useAuthGate();
  const [states, setStates] = useState<Record<string, ViewerState>>({});
  const key = ids.join(",");

  useEffect(() => {
    if (!isAuthenticated || !key) return;
    let active = true;
    void meydanApi<Record<string, ViewerState>>(`/content/viewer-states?ids=${key}`)
      .then((next) => {
        if (active) setStates((current) => ({ ...current, ...next }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuthenticated, key]);

  return states;
}
