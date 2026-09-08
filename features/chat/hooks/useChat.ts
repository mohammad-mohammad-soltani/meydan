"use client";

import { useEffect, useState } from "react";
import { getConversations, getNotifications } from "../services/chat.service";
import type { ChatNotification, Conversation } from "../types";

export type ChatSection = "conversations" | "notifications";

export function useChat() {
  const [section, setSection] = useState<ChatSection>("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([getConversations(), getNotifications()]).then(([nextConversations, nextNotifications]) => {
      if (!active) return;
      setConversations(nextConversations);
      setNotifications(nextNotifications);
      setIsLoading(false);
    });

    return () => { active = false; };
  }, []);

  return { section, setSection, conversations, notifications, isLoading };
}
