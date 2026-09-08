import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
};

export function MessageList({ messages, currentUserId }: MessageListProps) {
  return <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"><div className="flex justify-center"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">امروز</span></div>{messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} />)}</div>;
}
