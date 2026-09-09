import type { ChatAttachment, ChatMessage, ChatNotification, Conversation } from "../types";

const currentUserId = "current-user";

const conversations: Conversation[] = [
  {
    id: "tehran-enghelab",
    participant: { id: "tehran-enghelab", name: "پایگاه میدان انقلاب", handle: "@tehran_enghelab", avatarLabel: "انقلاب", avatarTone: "red", isVerified: true, isOnline: true },
    preview: "هماهنگی برای منبر ساعت ۲۱ نهایی شد.", updatedAt: "۱۱:۲۸", unreadCount: 14,
  },
  {
    id: "yazd-chakhmaq",
    participant: { id: "yazd-chakhmaq", name: "موکب امیرچخماق یزد", handle: "@yazd_chakhmaq", avatarLabel: "یزد", avatarTone: "amber" },
    preview: "نقشه سیم‌کشی ارسال شد؛ خداقوت.", updatedAt: "۱۱:۱۵", unreadCount: 20,
  },
  { id: "code-explore", participant: { id: "code-explore", name: "گروه رسانه و فناوری", handle: "@media_tech", avatarLabel: "رسانه", avatarTone: "emerald" }, preview: "از API جدید برای دریافت گزارش‌ها استفاده کنید.", updatedAt: "۱۱:۱۴", unreadCount: 3 },
  { id: "rah-dalileh", participant: { id: "rah-dalileh", name: "راهِ دلیله", handle: "@rahedalileh", avatarLabel: "ره", avatarTone: "slate", isVerified: true }, preview: "سم کوییم دیگر پایبند نیستیم؟! 🌐", updatedAt: "۱۱:۱۱", unreadCount: 202 },
  { id: "dev-twitter", participant: { id: "dev-twitter", name: "اتاق خبرِ میدان", handle: "@meydan_news", avatarLabel: "خبر", avatarTone: "blue" }, preview: "گزارش زنده از میدان‌ها منتشر شد.", updatedAt: "۱۰:۵۲", unreadCount: 1 },
  { id: "hosein-sabeti", participant: { id: "hosein-sabeti", name: "امیرحسین ثابتی", handle: "@sabeti", avatarLabel: "ث", avatarTone: "violet", isVerified: true }, preview: "آلبوم تصاویر مراسم در حاشیه اجلاس ارسال شد.", updatedAt: "۰۷:۳۸", unreadCount: 2 },
  { id: "temp-number", participant: { id: "temp-number", name: "سامانه پاسخ‌گویی", handle: "@support", avatarLabel: "پ", avatarTone: "blue" }, preview: "🔴 اطلاعیه جدید برای مسئولان پایگاه‌ها", updatedAt: "۰۴:۵۲", unreadCount: 44 },
  { id: "kanal-gheymat", participant: { id: "kanal-gheymat", name: "کانال گزارش‌های مردمی", handle: "@reports", avatarLabel: "گزارش", avatarTone: "red" }, preview: "وقتی بعد از مراسم باران می‌بارد، در خیابان…", updatedAt: "۰۲:۵۸", unreadCount: 6 },
  { id: "linuxor", participant: { id: "linuxor", name: "شبکه داوطلبان", handle: "@volunteers", avatarLabel: "دو", avatarTone: "emerald" }, preview: "برای ناوبری ایستگاه‌ها، یک راهنما آماده است.", updatedAt: "۰۲:۳۶", unreadCount: 1 },
];

const messagesByConversation: Record<string, ChatMessage[]> = {
  "tehran-enghelab": [
    { id: "message-1", conversationId: "tehran-enghelab", senderId: "tehran-enghelab", body: "سلام، وقت‌تان بخیر. تجهیزات صوتیِ پایگاه بررسی و آماده شد.", sentAt: "۲۰:۱۰", status: "sent" },
    { id: "message-2", conversationId: "tehran-enghelab", senderId: currentUserId, body: "خداقوت. فایل برنامه و زمان‌بندی نهایی را هم در بخش محتوا گذاشتم.", sentAt: "۲۰:۱۵", status: "sent" },
    { id: "message-3", conversationId: "tehran-enghelab", senderId: "tehran-enghelab", body: "دریافت شد، ممنون. شروع برنامه ساعت ۲۱ خواهد بود.", sentAt: "۲۰:۱۷", status: "sent" },
    { id: "message-4", conversationId: "tehran-enghelab", senderId: currentUserId, body: "عالی است. اگر موردی پیش آمد همین‌جا اطلاع دهید.", sentAt: "۲۰:۱۸", status: "sent" },
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

export async function sendMessage(conversationId: string, body: string, attachment?: ChatAttachment): Promise<ChatMessage> {
  return {
    id: "message-" + crypto.randomUUID(),
    conversationId,
    senderId: currentUserId,
    body,
    sentAt: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
    status: "sent",
    attachment,
  };
}

export function getCurrentUserId(): string {
  return currentUserId;
}
