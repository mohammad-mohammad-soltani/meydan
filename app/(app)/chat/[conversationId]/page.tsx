import type { Metadata } from "next";
import { ConversationView } from "@/features/chat/components/ConversationView";

export const metadata: Metadata = { title: "گفتگو | میدانِ خیابان" };

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  return <ConversationView conversationId={conversationId} conversation={null} messages={[]} />;
}
