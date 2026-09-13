import type { Metadata } from "next";
import { ChatContactView } from "@/features/chat/components/ChatContactView";

export const metadata: Metadata = { title: "اطلاعات گفتگو | نقش من" };

type ChatContactPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatContactPage({ params }: ChatContactPageProps) {
  const { conversationId } = await params;
  return <ChatContactView conversationId={conversationId} />;
}
