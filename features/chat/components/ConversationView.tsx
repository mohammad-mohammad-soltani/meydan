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

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

  const leaveConversation = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => router.push("/chat"), 220);
  };

  if (chat.isLoading) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">در حال باز کردن گفتگو...</section>;
  if (!chat.conversation) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">این گفتگو پیدا نشد.</section>;

  return <section className={"conversation-view chat-wallpaper flex h-full min-h-0 flex-1 flex-col overflow-hidden " + (isLeaving ? "conversation-view-leaving" : "conversation-view-entering")}><ChatHeader conversation={chat.conversation} isLeaving={isLeaving} onBack={leaveConversation} /><MessageList messages={chat.messages} currentUserId={getCurrentUserId()} onReply={chat.startReply} onCopy={chat.copyMessage} onEdit={chat.startEdit} onDelete={chat.requestDelete} onForward={chat.requestForward} onReact={chat.toggleReaction} />{chat.error ? <p className="bg-white/80 px-4 pb-2 text-[10px] text-red-500 dark:bg-[#0b141a]/80">{chat.error}</p> : null}<MessageInput value={chat.input} attachment={chat.attachment} replyingTo={chat.replyingTo} editingMessage={chat.editingMessage} notice={chat.notice} isSending={chat.isSending} onChange={chat.setInput} onSubmit={chat.send} onAttachmentSelected={chat.attachFile} onClearAttachment={chat.clearAttachment} onCancelReply={chat.cancelReply} onCancelEdit={chat.cancelEdit} />
    {chat.messageToDelete ? <div role="dialog" aria-modal="true" aria-label="حذف پیام" className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-3 sm:place-items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5 text-right shadow-2xl dark:bg-[#202c33]"><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"><Trash2 className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-slate-800 dark:text-white">حذف پیام؟</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-[#a9bac4]">این پیام از گفتگوی شما حذف می‌شود.</p></div></div><div className="mt-4 flex gap-2"><button type="button" onClick={chat.confirmDelete} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">حذف</button><button type="button" onClick={chat.cancelDelete} className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white">انصراف</button></div></div></div> : null}
    {chat.messageToForward ? <div role="dialog" aria-modal="true" aria-label="فوروارد پیام" className="fixed inset-0 z-50 flex items-end bg-black/35 sm:items-center sm:justify-center"><div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl dark:bg-[#202c33] sm:rounded-3xl"><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="بستن" onClick={chat.cancelForward} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button><h2 className="text-sm font-bold text-slate-800 dark:text-white">فوروارد به</h2></div><div className="max-h-72 space-y-1 overflow-y-auto">{chat.forwardTargets.map((target) => <button key={target.id} type="button" onClick={() => void chat.forwardTo(target)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-right hover:bg-slate-50 dark:hover:bg-white/10"><span className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">{target.participant.avatarLabel.slice(0, 1)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800 dark:text-white">{target.participant.name}</strong><small className="block truncate text-[10px] text-slate-500 dark:text-[#a9bac4]">{target.participant.handle}</small></span><Check className="h-4 w-4 text-slate-300" /></button>)}</div></div></div> : null}
  </section>;
}
