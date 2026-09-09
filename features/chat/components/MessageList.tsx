import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
};

export function MessageList({ messages, currentUserId }: MessageListProps) {
  return <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4"><div className="flex min-h-full flex-col justify-end gap-2.5"><div className="mb-2 flex justify-center"><span className="rounded-lg bg-[#78909c]/85 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm dark:bg-[#182d38]/90">امروز</span></div>{messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} />)}</div></div>;
}
