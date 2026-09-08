import type { ChatMessage, ChatNotification, Conversation } from "../types";

const currentUserId = "current-user";

const conversations: Conversation[] = [
  {
    id: "tehran-enghelab",
    participant: { id: "tehran-enghelab", name: "پایگاه میدان انقلاب", handle: "@tehran_enghelab", avatarLabel: "م.ا", avatarTone: "red", isVerified: true, isOnline: true },
    preview: "هماهنگی برای منبر ساعت ۲۱ نهایی شد.",
    updatedAt: "۱۰ دقیقه",
    unreadCount: 1,
  },
  {
    id: "yazd-chakhmaq",
    participant: { id: "yazd-chakhmaq", name: "موکب امیرچخماق یزد", handle: "@yazd_chakhmaq", avatarLabel: "یزد", avatarTone: "amber" },
    preview: "نقشه سیم‌کشی ارسال شد؛ خداقوت.",
    updatedAt: "۳۵ دقیقه",
    unreadCount: 0,
  },
];

const messagesByConversation: Record<string, ChatMessage[]> = {
  "tehran-enghelab": [
    { id: "message-1", conversationId: "tehran-enghelab", senderId: "tehran-enghelab", body: "سلام علیکم، سیستم صوتی میدان انقلاب وصل شد و آماده پخش صوت دمِ رأس ساعت ۲۱:۳۰ هستیم.", sentAt: "۲۰:۱۰", status: "sent" },
    { id: "message-2", conversationId: "tehran-enghelab", senderId: currentUserId, body: "خداقوت، فیش سخنرانی شب دوازدهم هم در صفحه محتوا بارگذاری شده است.", sentAt: "۲۰:۱۵", status: "sent" },
  ],
  "yazd-chakhmaq": [
    { id: "message-3", conversationId: "yazd-chakhmaq", senderId: "yazd-chakhmaq", body: "نقشه سیم‌کشی محل موکب را ارسال کردیم. اگر نکته‌ای هست بفرمایید.", sentAt: "۱۹:۴۰", status: "sent" },
  ],
};

const notifications: ChatNotification[] = [
  { id: "notification-1", kind: "like", title: "پسندیده شدن روایت شما", description: "پایگاه میدان شهدا مشهد و ۸۴ نفر دیگر روایت «طومار ۵۰ متری تجدید بیعت» را پسندیدند.", createdAt: "۱۲ دقیقه پیش" },
  { id: "notification-2", kind: "repost", title: "بازنشر روایت", description: "موکب امیرچخماق یزد روایت میدانی شما را در فید اختصاصی خود بازنشر کرد.", createdAt: "۲۸ دقیقه پیش" },
  { id: "notification-3", kind: "message", title: "پیام مستقیم جدید", description: "پایگاه میدان انقلاب: هماهنگی برای منبر ساعت ۲۱ نهایی شد.", createdAt: "۴۰ دقیقه پیش", conversationId: "tehran-enghelab" },
  { id: "notification-4", kind: "media", title: "بازتاب رسمی در مطبوعات", description: "مطلب شما در روزنامه عصر ایرانیان و عصر آنلاین درج شد.", createdAt: "۱ ساعت پیش" },
  { id: "notification-5", kind: "mention", title: "دیدگاه و اشاره به شما", description: "علی حسینی: ما هم از امشب در میدان ولیعصر این ابتکار را شروع کردیم.", createdAt: "۲ ساعت پیش" },
  { id: "notification-6", kind: "follow", title: "دنبال‌کننده جدید", description: "حجت‌الاسلام مهدی ماندگاری پایگاه میدان شما را دنبال کرد.", createdAt: "۳ ساعت پیش" },
];

export async function getConversations(): Promise<Conversation[]> {
  return conversations.map((conversation) => ({ ...conversation, participant: { ...conversation.participant } }));
}

export async function getNotifications(): Promise<ChatNotification[]> {
  return notifications.map((notification) => ({ ...notification }));
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const conversation = conversations.find((item) => item.id === conversationId);
  return conversation ? { ...conversation, participant: { ...conversation.participant } } : null;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return (messagesByConversation[conversationId] ?? []).map((message) => ({ ...message }));
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  return {
    id: "message-" + crypto.randomUUID(),
    conversationId,
    senderId: currentUserId,
    body,
    sentAt: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
    status: "sent",
  };
}

export function getCurrentUserId(): string {
  return currentUserId;
}
