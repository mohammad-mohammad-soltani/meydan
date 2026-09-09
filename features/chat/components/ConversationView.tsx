"use client";

import { getCurrentUserId } from "../services/chat.service";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useConversation } from "../hooks/useConversation";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import type { ChatMessage, Conversation } from "../types";

export function ConversationView({ conversationId, conversation, messages }: { conversationId: string; conversation: Conversation | null; messages: ChatMessage[] }) {
  const chat = useConversation(conversationId, conversation, messages);
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => { router.prefetch("/chat"); }, [router]);

  const leaveConversation = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => router.push("/chat"), 220);
  };

  if (chat.isLoading) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">در حال باز کردن گفتگو...</section>;
  if (!chat.conversation) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">این گفتگو پیدا نشد.</section>;

  return (
    <section className={`relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface-sunken before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[url('/images/patterns/resistance-chat-pattern-v2.png')] before:bg-[length:512px_512px] before:bg-repeat before:bg-center before:opacity-10 [&>*]:relative [&>*]:z-[1] ${isLeaving ? "ui-view-leave" : "ui-view-enter"}`}>
      <ChatHeader conversation={chat.conversation} isLeaving={isLeaving} onBack={leaveConversation} />
      <MessageList messages={chat.messages} currentUserId={getCurrentUserId()} onReply={chat.startReply} onCopy={chat.copyMessage} onEdit={chat.startEdit} onDelete={chat.requestDelete} onForward={chat.requestForward} onReact={chat.toggleReaction} />
      {chat.error ? <p className="bg-danger-surface px-4 pb-2 text-[10px] text-danger-foreground">{chat.error}</p> : null}
      <MessageInput value={chat.input} attachment={chat.attachment} replyingTo={chat.replyingTo} editingMessage={chat.editingMessage} notice={chat.notice} isSending={chat.isSending} onChange={chat.setInput} onSubmit={chat.send} onAttachmentSelected={chat.attachFile} onClearAttachment={chat.clearAttachment} onCancelReply={chat.cancelReply} onCancelEdit={chat.cancelEdit} />

      {chat.messageToDelete ? (
        <div role="dialog" aria-modal="true" aria-label="حذف پیام" className="fixed inset-0 z-50 grid place-items-end bg-overlay p-3 sm:place-items-center">
          <div className="w-full max-w-sm rounded-panel bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-danger-surface text-danger"><Trash2 className="h-5 w-5" /></span>
              <div><h2 className="text-sm font-bold text-foreground">حذف پیام؟</h2><p className="mt-0.5 text-xs text-muted-foreground">این پیام از گفتگوی شما حذف می‌شود.</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={chat.confirmDelete} className="flex-1 rounded-control bg-danger px-3 py-2 text-xs font-semibold text-on-solid hover:opacity-90">حذف</button>
              <button type="button" onClick={chat.cancelDelete} className="flex-1 rounded-control bg-surface-muted px-3 py-2 text-xs font-semibold text-foreground-secondary hover:bg-hover">انصراف</button>
            </div>
          </div>
        </div>
      ) : null}

      {chat.messageToForward ? (
        <div role="dialog" aria-modal="true" aria-label="فوروارد پیام" className="fixed inset-0 z-50 flex items-end bg-overlay sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-t-panel bg-popover p-4 text-popover-foreground shadow-dialog sm:rounded-panel">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" aria-label="بستن" onClick={chat.cancelForward} className="grid h-9 w-9 place-items-center rounded-full text-icon-muted hover:bg-hover"><X className="h-4 w-4" /></button>
              <h2 className="text-sm font-bold text-foreground">فوروارد به</h2>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto no-scrollbar">
              {chat.forwardTargets.map((target) => (
                <button key={target.id} type="button" onClick={() => void chat.forwardTo(target)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-right transition-colors hover:bg-hover">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-info-surface text-xs font-bold text-info">{target.participant.avatarLabel.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-foreground">{target.participant.name}</strong><small className="block truncate text-[10px] text-muted-foreground">{target.participant.handle}</small></span>
                  <Check className="h-4 w-4 text-icon-muted" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
