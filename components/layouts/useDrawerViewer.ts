"use client";

import { useMe } from "@/lib/me-client";

type Identity = { name?: string; full_name?: string; handle?: string; avatar_url?: string; cover_url?: string; verified?: boolean };

type ApiMe = {
  account_type?: string;
  profile?: Identity;
  entity?: Identity | null;
  square?: Identity | null;
  social?: { followers?: number; following?: number };
};

export type DrawerViewer = {
  name: string;
  handle: string;
  avatarUrl?: string;
  coverUrl?: string;
  verified: boolean;
  kind?: string;
  followers: number;
  following: number;
};

const ENTITY_TYPES = new Set(["square", "media", "collective", "organization"]);

/** The header avatar and the mobile drawer, from the shared `/me` read. */
export function useDrawerViewer(isAuthenticated: boolean): DrawerViewer | null {
  const { me } = useMe<ApiMe>(isAuthenticated);
  if (!me) return null;
  const isEntity = ENTITY_TYPES.has(me.account_type ?? "");
  const identity = (isEntity ? (me.entity ?? me.square) : me.profile) ?? {};
  return {
    name: identity.name || identity.full_name || (isEntity ? "حساب من" : "کاربر میدان"),
    handle: identity.handle ?? "",
    avatarUrl: identity.avatar_url || undefined,
    coverUrl: identity.cover_url || undefined,
    verified: Boolean(identity.verified),
    kind: isEntity ? me.account_type : undefined,
    followers: me.social?.followers ?? 0,
    following: me.social?.following ?? 0,
  };
}
