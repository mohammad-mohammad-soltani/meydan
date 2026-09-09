import type { Conversation } from "../types";
import { ConversationItem } from "./ConversationItem";

type ConversationListProps = {
  conversations: Conversation[];
  isLoading: boolean;
};

export function ConversationList({ conversations, isLoading }: ConversationListProps) {
  if (isLoading) return <p className="py-10 text-center text-sm text-slate-500">در حال دریافت گفتگوها...</p>;
  if (!conversations.length) return <p className="py-10 text-center text-sm text-slate-500">گفتگویی پیدا نشد.</p>;

  return <div className="bg-white dark:bg-[#1f1f1f]">{conversations.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} />)}</div>;
}
