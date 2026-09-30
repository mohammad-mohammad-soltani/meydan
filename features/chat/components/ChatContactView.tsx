"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getConversationById, getConversationHistory, setConversationMuted } from "../services/chat.service";
import type { ChatMessage, Conversation } from "../types";
import { ChatUserInfo } from "./ChatUserInfo";

export function ChatContactView({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch(`/chat/${conversationId}` as Route);
    let active = true;
    queueMicrotask(() => { if (active) setIsLoading(true); });
    void Promise.all([getConversationById(conversationId), getConversationHistory(conversationId, 300)])
      .then(([nextConversation, nextMessages]) => {
        if (!active) return;
        setConversation(nextConversation);
        setMessages(nextMessages);
        setMuted(Boolean(nextConversation?.notificationsMuted));
        setError(nextConversation ? null : "این گفتگو پیدا نشد.");
      })
      .catch(() => {
        if (active) setError("دریافت اطلاعات گفتگو انجام نشد.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [conversationId, router]);

  const returnToChat = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => router.replace(`/chat/${conversationId}` as Route), 180);
  };

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);
    setError(null);
    try {
      const updated = await setConversationMuted(conversationId, next);
      setMuted(Boolean(updated.notificationsMuted));
      setConversation((current) => current ? { ...current, notificationsMuted: Boolean(updated.notificationsMuted) } : current);
    } catch {
      setMuted(!next);
      setError("تغییر وضعیت اعلان‌ها انجام نشد.");
    }
  };

  if (isLoading) return <section className="flex h-full min-h-0 flex-1 items-center justify-center bg-background text-xs text-muted-foreground">در حال دریافت اطلاعات کاربر...</section>;
  if (!conversation) return <section className="flex h-full min-h-0 flex-1 items-center justify-center bg-background px-6 text-center text-xs text-muted-foreground">{error || "این گفتگو پیدا نشد."}</section>;

  const conversationForUi = { ...conversation, notificationsMuted: muted };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <ChatUserInfo
        conversation={conversationForUi}
        messages={messages}
        muted={muted}
        isLeaving={isLeaving}
        onBack={returnToChat}
        onChat={returnToChat}
        onToggleMute={() => void toggleMute()}
        onOpenProfile={(href) => router.push(href as Route)}
      />
      {error ? <p className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-danger-surface px-4 py-2 text-xs text-danger-foreground shadow-sm">{error}</p> : null}
    </div>
  );
}
