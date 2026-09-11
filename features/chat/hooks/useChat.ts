"use client";

import { useEffect, useState } from "react";
import { getChatSocket } from "../realtime/socket";
import { getConversations, getNotifications } from "../services/chat.service";
import type { ChatNotification, Conversation } from "../types";

export type ChatSection = "conversations" | "notifications";

export function useChat(initialConversations: Conversation[] = [], initialNotifications: ChatNotification[] = []) {
  const [section, setSection] = useState<ChatSection>("conversations");
  const [conversations, setConversations] = useState(initialConversations);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState(initialConversations.length === 0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [nextConversations, nextNotifications] = await Promise.all([getConversations(), getNotifications()]);
        if (!active) return;
        setConversations(nextConversations);
        setNotifications(nextNotifications);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void refresh();

    let socketRef: Awaited<ReturnType<typeof getChatSocket>> | null = null;
    const onConversationUpdated = () => void refresh();
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) => {
      setConversations((current) => current.map((conversation) => conversation.participant.id === String(userId)
        ? { ...conversation, participant: { ...conversation.participant, isOnline: Boolean(online) } }
        : conversation));
    };

    void getChatSocket().then((socket) => {
      if (!active) return;
      socketRef = socket;
      socket.on("conversation:updated", onConversationUpdated);
      socket.on("message:created", onConversationUpdated);
      socket.on("receipt:read", onConversationUpdated);
      socket.on("presence:changed", onPresence);
    }).catch(() => undefined);

    return () => {
      active = false;
      if (!socketRef) return;
      socketRef.off("conversation:updated", onConversationUpdated);
      socketRef.off("message:created", onConversationUpdated);
      socketRef.off("receipt:read", onConversationUpdated);
      socketRef.off("presence:changed", onPresence);
    };
  }, []);

  return { section, setSection, conversations, notifications, isLoading };
}
