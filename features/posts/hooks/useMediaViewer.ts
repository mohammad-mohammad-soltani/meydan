"use client";

import { useEffect, useState } from "react";

import { meydanApi } from "@/lib/meydan-api";

type MeMedia = { media_outlet_id?: number | null; entity?: { id?: number | null } | null; square?: { id?: number | null } | null };

export type MediaViewer = {
  /** The republishing outlet of an approved media account; null for everyone else. */
  outletId: number | null;
  /** The viewer's own account id, used to list their posts. */
  squareId: number | null;
};

const NONE: MediaViewer = { outletId: null, squareId: null };

/**
 * Whether the signed-in viewer is an approved media account (رسانه).
 * `/me` is authenticated, so guests must pass `enabled = false`.
 */
export function useMediaViewer(enabled: boolean): MediaViewer {
  const [viewer, setViewer] = useState<MediaViewer>(NONE);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void meydanApi<MeMedia>("/me")
      .then((me) => {
        if (!active) return;
        const outletId = Number(me.media_outlet_id ?? 0);
        setViewer(outletId > 0 ? { outletId, squareId: Number((me.entity ?? me.square)?.id ?? 0) || null } : NONE);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled ? viewer : NONE;
}
