"use client";

import { useState } from "react";
import type { ChatNotification, Conversation } from "../types";

export type ChatSection = "conversations" | "notifications";

export function useChat(initialConversations: Conversation[], initialNotifications: ChatNotification[]) {
  const [section, setSection] = useState<ChatSection>("conversations");
  const [conversations] = useState(initialConversations);
  const [notifications] = useState(initialNotifications);

  return { section, setSection, conversations, notifications, isLoading: false };
}
