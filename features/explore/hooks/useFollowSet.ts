"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { actorKey, getFollowingStates, setActorFollowing, type ActorType } from "@/lib/meydan-follow";

type Account = { type: ActorType; id: number };

/**
 * Follow state for a list of accounts: one batched read when the list arrives,
 * then optimistic toggles that roll back if the write fails.
 */
export function useFollowSet(accounts: Account[]) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const asked = useRef("");
  const signature = accounts.map((entry) => actorKey(entry.type, entry.id)).sort().join(",");

  useEffect(() => {
    if (!isAuthenticated || !signature || asked.current === signature) return;
    asked.current = signature;
    let live = true;
    void getFollowingStates(accounts)
      .then(({ keys }) => { if (live) setFollowing(new Set(keys)); })
      .catch(() => undefined);
    return () => { live = false; };
    // `accounts` is summarised by `signature`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, signature]);

  const toggle = useCallback(async (type: ActorType, id: number) => {
    if (!requireAuth("/explore")) return;
    const key = actorKey(type, id);
    if (pending.has(key)) return;
    const next = !following.has(key);
    const apply = (value: boolean) => setFollowing((current) => { const copy = new Set(current); if (value) copy.add(key); else copy.delete(key); return copy; });
    apply(next);
    setPending((current) => new Set(current).add(key));
    try {
      await setActorFollowing(type, id, next);
    } catch {
      apply(!next);
    } finally {
      setPending((current) => { const copy = new Set(current); copy.delete(key); return copy; });
    }
  }, [following, pending, requireAuth]);

  return { isFollowing: (type: ActorType, id: number) => following.has(actorKey(type, id)), toggle };
}
