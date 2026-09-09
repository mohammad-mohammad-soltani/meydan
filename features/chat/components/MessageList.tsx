import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onReact: (messageId: string, reaction: string) => void;
};

export function MessageList({ messages, currentUserId, onReply, onCopy, onEdit, onDelete, onForward, onReact }: MessageListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
      <div className="flex min-h-full flex-col justify-end gap-2.5">
        <div className="mb-2 flex justify-center"><span className="rounded-lg bg-surface-glass px-2.5 py-1 text-[10px] font-medium text-foreground-secondary shadow-xs backdrop-blur">امروز</span></div>
        {messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} onReply={onReply} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} onForward={onForward} onReact={onReact} />)}
      </div>
    </div>
  );
}
