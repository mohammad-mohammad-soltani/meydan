"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { worksPage } from "@/features/works/services/works.service";
import { getConversations } from "../services/chat.service";
import { getUnreadNotificationCount } from "../services/notification.service";

export type UnreadCounts = {
  /** Sum of `unreadCount` across every conversation. */
  messages: number;
  /** Unread social notifications (the bell tab on /chat). */
  notifications: number;
  total: number;
};

export type UnreadContextValue = UnreadCounts & {
  /**
   * Re-reads both counters immediately. Call it after an action that reads
   * something (marking a notification read, "read all", …) so the navigation
   * badges change without waiting for the socket or the next poll.
   */
  refresh: () => void;
};

const EMPTY: UnreadContextValue = {
  messages: 0,
  notifications: 0,
  total: 0,
  refresh: () => {},
};

const UnreadContext = createContext<UnreadContextValue>(EMPTY);

/**
 * Keeps a single app-wide unread counter for the navigation badges. It listens
 * on the shared Soketi private channel plus a slow poll, so the badge stays
 * correct without the chat page being open. Only mounted for signed-in users —
 * the API would redirect a guest anyway.
 */
export function UnreadProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  const [counts, setCounts] = useState({ messages: 0, notifications: 0 });
  // Kept in a ref so the exposed `refresh` stays stable across renders and can
  // be called even before the effect below has run.
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const refresh = async () => {
      const [conversations, notifications, works] = await Promise.allSettled([
        getConversations(),
        getUnreadNotificationCount(true),
        // Work groups are part of the chat list now, so their unread counts feed the same badge.
        worksPage("joined", ""),
      ]);
      if (!active) return;
      if (conversations.status === "fulfilled") {
        const direct = conversations.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
        const work = works.status === "fulfilled" ? works.value.data.reduce((sum, item) => sum + (item.viewer.unread_count || 0), 0) : 0;
        const messages = direct + work;
        setCounts((current) => (current.messages === messages ? current : { ...current, messages }));
      }
      if (notifications.status === "fulfilled") {
        setCounts((current) =>
          current.notifications === notifications.value
            ? current
            : { ...current, notifications: notifications.value },
        );
      }
    };

    refreshRef.current = () => void refresh();
    void refresh();

    let unbind: (() => void) | null = null;
    // Every event that can change either counter arrives on the user's private
    // Soketi channel; the poll below stays as a slow safety net.
    void subscribeToUserChannel({
      "conversation:updated": () => void refresh(),
      "message:created": () => void refresh(),
      "receipt:read": () => void refresh(),
      "notification:created": () => void refresh(),
      "notification:updated": () => void refresh(),
      "work:message:created": () => void refresh(),
      "work:read": () => void refresh(),
    })
      .then((off) => {
        if (active) unbind = off;
        else off();
      })
      .catch(() => undefined);

    const pollId = window.setInterval(() => void refresh(), 30_000);

    return () => {
      active = false;
      refreshRef.current = () => {};
      window.clearInterval(pollId);
      unbind?.();
    };
  }, [isAuthenticated]);

  const refresh = useCallback(() => refreshRef.current(), []);

  const value = useMemo<UnreadContextValue>(
    () => ({
      messages: counts.messages,
      notifications: counts.notifications,
      total: counts.messages + counts.notifications,
      refresh,
    }),
    [counts.messages, counts.notifications, refresh],
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnreadCounts(): UnreadContextValue {
  return useContext(UnreadContext);
}
