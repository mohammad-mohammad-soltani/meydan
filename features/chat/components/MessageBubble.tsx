import { CheckCheck, Clock3, TriangleAlert } from "lucide-react";
import type { ChatMessage, MessageStatus } from "../types";

const statusIcon: Record<MessageStatus, typeof CheckCheck> = {
  sending: Clock3,
  sent: CheckCheck,
  failed: TriangleAlert,
};

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const StatusIcon = statusIcon[message.status];
  return <div className={"flex " + (isOwn ? "justify-start" : "justify-end")}><article className={"max-w-[84%] rounded-2xl px-3 py-2 text-[13px] leading-6 shadow-sm " + (isOwn ? "rounded-tr-md bg-[#d9fdd3] text-[#172b1d] dark:bg-[#005c4b] dark:text-[#e8fff7]" : "rounded-tl-md bg-white text-slate-800 dark:bg-[#202c33] dark:text-[#e9edef]")}><p className="whitespace-pre-wrap">{message.body}</p><footer className={"mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-4 " + (isOwn ? "text-[#5f7e66] dark:text-[#9ccabc]" : "text-slate-400 dark:text-[#8696a0]")}><time>{message.sentAt}</time>{isOwn ? <StatusIcon className="h-3.5 w-3.5" aria-label={message.status} /> : null}</footer></article></div>;
}
