"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { mapApiNotification, mergeNotification, shouldRefreshNotificationFromApi, type ApiNotificationLike } from "../chat-utils";
import { useUnreadCounts } from "../providers/UnreadProvider";
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
    let unbind: (() => void) | null = null;
    void Promise.allSettled([refreshConversations(), refreshNotifications()]);

    const onConversationUpdated = () => void refreshConversations();
    const onPresence = (payload: unknown) => {
      if (!active) return;
      const record = payload && typeof payload === "object" ? payload as { userId?: unknown; online?: unknown } : null;
      if (!record) return;
      setConversations((current) => current.map((conversation) => conversation.participant.id === String(record.userId)
        ? { ...conversation, participant: { ...conversation.participant, isOnline: Boolean(record.online) } }
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
      // Realtime payloads omit actor/entity data, so they cannot produce a real actor
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

    // One subscription per component on the shared private channel; the
    // helper removes only these bindings when the chat screen unmounts.
    void subscribeToUserChannel({
      "conversation:updated": onConversationUpdated,
      "message:created": onConversationUpdated,
      "receipt:read": onConversationUpdated,
      "presence:changed": onPresence,
      "notification:created": (payload) => onNotificationCreated(payload as ApiNotificationLike),
      "notification:updated": onNotificationUpdated,
    })
      .then((off) => {
        if (active) unbind = off;
        else off();
      })
      .catch(() => undefined);

    const pollId = window.setInterval(() => void refreshNotifications(), 30_000);

    return () => {
      active = false;
      window.clearInterval(pollId);
      unbind?.();
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
