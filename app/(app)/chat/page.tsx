import { ChatView } from "@/features/chat/components/ChatView";
import { getConversations, getNotifications } from "@/features/chat/services/chat.service";

export default async function ChatPage() {
  const [conversations, notifications] = await Promise.all([getConversations(), getNotifications()]);
  return <ChatView conversations={conversations} notifications={notifications} />;
}
