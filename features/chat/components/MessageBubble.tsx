import { Check, Clock3, TriangleAlert } from "lucide-react";
import type { ChatMessage, MessageStatus } from "../types";

const statusIcon: Record<MessageStatus, typeof Check> = {
  sending: Clock3,
  sent: Check,
  failed: TriangleAlert,
};

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const StatusIcon = statusIcon[message.status];
  return <div className={"flex " + (isOwn ? "justify-end" : "justify-start")}><article className={"max-w-[82%] rounded-2xl px-3 py-2.5 text-xs leading-6 shadow-sm " + (isOwn ? "rounded-bl-md bg-brand-red text-white" : "rounded-br-md bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100")}><p>{message.body}</p><footer className={"mt-1 flex items-center justify-end gap-1 text-[9px] " + (isOwn ? "text-white/75" : "text-slate-400")}><time>{message.sentAt}</time>{isOwn ? <StatusIcon className="h-3 w-3" aria-label={message.status} /> : null}</footer></article></div>;
}
