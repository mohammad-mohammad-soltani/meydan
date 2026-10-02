"use client";

import { useEffect, useState } from "react";

import { meydanApi } from "@/lib/meydan-api";

/**
 * One `/me` request per page load, shared by every client component that
 * needs the viewer (sidebar card, mobile drawer, role and media hooks).
 * Each of them used to call `/me` on its own.
 */
let pending: Promise<Record<string, unknown>> | null = null;

export function getMe<T = Record<string, unknown>>(): Promise<T> {
  pending ??= meydanApi<Record<string, unknown>>("/me").catch((reason) => {
    // A failed read must not stick: the next caller tries again.
    pending = null;
    throw reason;
  });
  return pending as Promise<T>;
}

/** Drops the shared result, e.g. after the profile was edited or on logout. */
export function invalidateMe(): void {
  pending = null;
}

/** `/me` for signed-in viewers; guests must pass `enabled = false`. */
export function useMe<T = Record<string, unknown>>(enabled: boolean): { me: T | null; loading: boolean } {
  const [state, setState] = useState<{ me: T | null; loading: boolean }>({ me: null, loading: enabled });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void getMe<T>()
      .then((me) => active && setState({ me, loading: false }))
      .catch(() => active && setState({ me: null, loading: false }));
    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled ? state : { me: null, loading: false };
}

const ENTITY_TYPES = new Set(["square", "media", "collective", "organization"]);

/** `type:id` of the viewer's own actor, e.g. to hide «follow» on their own posts. */
export function useOwnActorKey(enabled: boolean): string | null {
  const { me } = useMe<{ account_type?: string; profile?: { id?: number }; entity?: { id?: number } | null; square?: { id?: number } | null }>(enabled);
  if (!me?.account_type) return null;
  if (ENTITY_TYPES.has(me.account_type)) {
    const id = (me.entity ?? me.square)?.id;
    return id ? `${me.account_type}:${id}` : null;
  }
  return me.profile?.id ? `user:${me.profile.id}` : null;
}
