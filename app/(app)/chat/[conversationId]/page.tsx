import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationView } from "@/features/chat/components/ConversationView";
import { getConversationById, getMessages } from "@/features/chat/services/chat.service";

export const metadata: Metadata = { title: "گفتگو | میدانِ خیابان" };

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  const [conversation, messages] = await Promise.all([getConversationById(conversationId), getMessages(conversationId)]);
  if (!conversation) notFound();
  return <ConversationView conversationId={conversationId} conversation={conversation} messages={messages} />;
}
