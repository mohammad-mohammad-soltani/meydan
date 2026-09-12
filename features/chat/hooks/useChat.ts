"use client";

import { useCallback, useEffect, useState } from "react";
import { mapApiNotification, mergeNotification, shouldRefreshNotificationFromApi, type ApiNotificationLike } from "../chat-utils";
import { useUnreadCounts } from "../providers/UnreadProvider";
import { getChatSocket } from "../realtime/socket";
import { getConversations } from "../services/chat.service";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";
import type { ChatNotification, Conversation } from "../types";

export type ChatSection = "conversations" | "notifications";

const MESSAGE_NOTIFICATION_TYPES = new Set(["message", "chat_message", "direct_message"]);

export function useChat(initialConversations: Conversation[] = [], initialNotifications: ChatNotification[] = []) {
  // Reading a notification must also move the navigation badge: the API emits
  // no socket event for the actor's own read, so the shared counter is asked to
  // re-read itself right after the write succeeds.
  const { refresh: refreshUnreadCounts } = useUnreadCounts();
  const [section, setSectionState] = useState<ChatSection>("conversations");
  const [conversations, setConversations] = useState(initialConversations);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(
    initialNotifications.filter((item) => item.unread).length,
  );
  const [isLoading, setIsLoading] = useState(initialConversations.length === 0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(initialNotifications.length === 0);

  const refreshConversations = useCallback(async () => {
    try {
      const nextConversations = await getConversations();
      setConversations(nextConversations);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const [nextNotifications, nextUnreadCount] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(nextNotifications);
      setUnreadNotificationCount(nextUnreadCount);
    } catch {
      // Keep the last successful state. The next socket event/poll will retry.
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  const setSection = useCallback((next: ChatSection) => {
    setSectionState(next);
    if (next === "notifications") void refreshNotifications();
  }, [refreshNotifications]);

  const readNotification = useCallback(async (notificationId: string) => {
    let wasUnread = false;
    setNotifications((current) => current.map((item) => {
      if (item.id !== notificationId) return item;
      wasUnread = Boolean(item.unread);
      return { ...item, unread: false };
    }));
    if (wasUnread) setUnreadNotificationCount((count) => Math.max(0, count - 1));

    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => item.id === notificationId ? updated : item));
      refreshUnreadCounts();
    } catch {
      await refreshNotifications();
      refreshUnreadCounts();
    }
  }, [refreshNotifications, refreshUnreadCounts]);

  const readAllNotifications = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    setUnreadNotificationCount(0);
    try {
      await markAllNotificationsRead();
      refreshUnreadCounts();
    } catch {
      await refreshNotifications();
      refreshUnreadCounts();
    }
  }, [refreshNotifications, refreshUnreadCounts]);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([refreshConversations(), refreshNotifications()]);

    let socketRef: Awaited<ReturnType<typeof getChatSocket>> | null = null;
    const onConversationUpdated = () => void refreshConversations();
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) => {
      if (!active) return;
      setConversations((current) => current.map((conversation) => conversation.participant.id === String(userId)
        ? { ...conversation, participant: { ...conversation.participant, isOnline: Boolean(online) } }
        : conversation));
    };
    const onNotificationCreated = (payload?: ApiNotificationLike) => {
      if (!active) return;
      if (!payload?.id) {
        void refreshNotifications();
        return;
      }
      if (MESSAGE_NOTIFICATION_TYPES.has(String(payload.type || "").toLowerCase())) return;
      const incoming = mapApiNotification(payload);
      // Socket payloads omit actor/entity data, so they cannot produce a real actor
      // sentence or avatar. Go straight to the authoritative API rather than briefly
      // rendering a generic placeholder that gets replaced a moment later.
      if (shouldRefreshNotificationFromApi(incoming)) {
        void refreshNotifications();
        return;
      }
      setNotifications((current) => mergeNotification(current, incoming));
      if (incoming.unread) void refreshNotifications();
    };
    const onNotificationUpdated = () => void refreshNotifications();

    void getChatSocket().then((socket) => {
      if (!active) return;
      socketRef = socket;
      socket.on("conversation:updated", onConversationUpdated);
      socket.on("message:created", onConversationUpdated);
      socket.on("receipt:read", onConversationUpdated);
      socket.on("presence:changed", onPresence);
      socket.on("notification:created", onNotificationCreated);
      socket.on("notification:updated", onNotificationUpdated);
    }).catch(() => undefined);

    const pollId = window.setInterval(() => void refreshNotifications(), 30_000);

    return () => {
      active = false;
      window.clearInterval(pollId);
      if (!socketRef) return;
      socketRef.off("conversation:updated", onConversationUpdated);
      socketRef.off("message:created", onConversationUpdated);
      socketRef.off("receipt:read", onConversationUpdated);
      socketRef.off("presence:changed", onPresence);
      socketRef.off("notification:created", onNotificationCreated);
      socketRef.off("notification:updated", onNotificationUpdated);
    };
  }, [refreshConversations, refreshNotifications]);

  return {
    section,
    setSection,
    conversations,
    notifications,
    unreadNotificationCount,
    isLoading,
    isNotificationsLoading,
    refreshNotifications,
    readNotification,
    readAllNotifications,
  };
}
