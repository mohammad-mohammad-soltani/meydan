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
import { getChatSocket } from "../realtime/socket";
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

/** Socket events that can change either counter. */
const REFRESH_EVENTS = [
  "conversation:updated",
  "message:created",
  "receipt:read",
  "notification:created",
  "notification:updated",
] as const;

/**
 * Keeps a single app-wide unread counter for the navigation badges. It uses the
 * shared chat socket and a slow poll, so the badge stays correct without the
 * chat page being open. Only mounted for signed-in users — the API would
 * redirect a guest anyway.
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
      const [conversations, notifications] = await Promise.allSettled([
        getConversations(),
        getUnreadNotificationCount(),
      ]);
      if (!active) return;
      if (conversations.status === "fulfilled") {
        const messages = conversations.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
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

    let socketRef: Awaited<ReturnType<typeof getChatSocket>> | null = null;
    void getChatSocket()
      .then((socket) => {
        if (!active) return;
        socketRef = socket;
        for (const event of REFRESH_EVENTS) socket.on(event, refresh);
      })
      .catch(() => undefined);

    const pollId = window.setInterval(() => void refresh(), 30_000);

    return () => {
      active = false;
      refreshRef.current = () => {};
      window.clearInterval(pollId);
      if (!socketRef) return;
      for (const event of REFRESH_EVENTS) socketRef.off(event, refresh);
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
