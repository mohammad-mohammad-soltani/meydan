import type { Conversation } from "../types";
import { ConversationItem } from "./ConversationItem";

type ConversationListProps = {
  conversations: Conversation[];
  isLoading: boolean;
};

export function ConversationList({ conversations, isLoading }: ConversationListProps) {
  if (isLoading) return <p className="py-6 text-center text-xs text-slate-500">در حال دریافت گفتگوها...</p>;
  if (!conversations.length) return <p className="py-6 text-center text-xs text-slate-500">گفتگویی برای نمایش وجود ندارد.</p>;

  return <div className="space-y-2.5">{conversations.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} />)}</div>;
}
