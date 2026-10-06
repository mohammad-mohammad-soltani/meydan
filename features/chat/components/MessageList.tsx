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
  onRetryVoice?: (message: ChatMessage) => void;
};

export function MessageList({ messages, currentUserId, onReply, onCopy, onEdit, onDelete, onForward, onReact, onRetryVoice }: MessageListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 no-scrollbar">
      <div className="flex min-h-full flex-col gap-1.5">
        <div className="mb-1.5 flex justify-center"><span className="rounded-full bg-surface-muted px-3 py-1 text-[11.5px] text-muted-foreground">امروز</span></div>
        {messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} onReply={onReply} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} onForward={onForward} onReact={onReact} onRetryVoice={onRetryVoice} />)}
      </div>
    </div>
  );
}
