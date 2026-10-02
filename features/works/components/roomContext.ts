"use client";

import { createContext, useContext } from "react";
import type { WorkGroup, WorkMessage } from "../types";

export type RoomCtx = {
  work: WorkGroup;
  viewerId: string;
  /** Owner / appointed admin / site administrator. */
  manager: boolean;
  /** Joined member (or manager). Non-members can only read. */
  member: boolean;
  act: (path: string, method?: string, body?: unknown) => Promise<unknown>;
  /** Shows "join first" and returns false when the viewer is not a member. */
  guard: () => boolean;
  reply: (m: WorkMessage) => void;
  jump: (id: string) => void;
  detailsOpen: Set<string>;
  toggleDetails: (id: string) => void;
  /** Re-send a failed optimistic message is not offered: failed sends are removed and the draft is kept. */
};

export const RoomContext = createContext<RoomCtx | null>(null);

export function useRoom(): RoomCtx {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside <RoomContext.Provider>");
  return ctx;
}
