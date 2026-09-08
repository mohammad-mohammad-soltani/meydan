import type { ContentItem, ContentQuickAction, ScheduleItem } from "../types";

const contentItems: ContentItem[] = [
  { id: "nahj-jihad", category: "featured", status: "urgent", badge: "منبر شبانه", title: "شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی", subtitle: "شرح خطبه جهاد متناسب با روحیه ایستادگی", description: "صوت و متن بیانات پیرامون پایداری در نبرد تبیین و حضور سازمان‌یافته مردمی.", media: { kind: "image", description: "تصویر و متن ویژه" } },
  { id: "panahian-square", category: "talks", status: "ready", title: "مفهوم «میدانِ خیابان» در دفاع اجتماعی", subtitle: "فیش ۱۰ دقیقه‌ای منبر", description: "سرفصل‌های تبیین میدانِ خیابان برای استفاده در جمع‌های مردمی.", author: "حجت‌الاسلام علیرضا پناهیان", media: { kind: "document", description: "فیش منبر" } },
  { id: "rafiei-crisis", category: "talks", status: "ready", title: "سیره اهل‌بیت در مواجهه با محاصره و بحران", subtitle: "فیش ۱۰ دقیقه‌ای منبر", description: "استناد به آیات سوره احزاب و مسیر مواسات در بحران.", author: "استاد ناصر رفیعی", media: { kind: "document", description: "فیش منبر" } },
  { id: "farmandeh-song", category: "audio", status: "ready", title: "دم هماهنگ: «فرمانده کل قوا»", subtitle: "با نوای حاج میثم مطیعی", description: "اجرا شده در اجتماع ۳۰ هزار نفری میدان انقلاب تهران؛ شب دوازدهم.", media: { kind: "audio", duration: "۳ دقیقه", description: "دم و سرود حماسی" } }
];

const scheduleItems: ScheduleItem[] = [
  { id: "night-1", night: "شب اول", number: "۰۱", title: "شهدای رمضان", description: "آغاز خروش خیابانی" },
  { id: "night-12", night: "امشب", number: "۱۲", title: "خونخواهی و بیعت", description: "حضور ۴۰۰ شهر", current: true },
  { id: "night-13", night: "شب سیزدهم", number: "۱۳", title: "مقاومت پایدار", description: "تجدید عهد ملی" }
];

const quickActions: ContentQuickAction[] = [
  { id: "speakers", label: "اعزام سخنران", detail: "درخواست و پیگیری", icon: "speakers", href: "/speakers" },
  { id: "contact", label: "ارتباط با ما", detail: "راه‌های ارتباطی", icon: "contact" },
  { id: "print", label: "چاپ پلاکارد", detail: "فایل‌های آماده چاپ", icon: "print" },
  { id: "safety", label: "راهنمای ایمنی", detail: "دستورالعمل میدانی", icon: "safety" }
];

/** Content data boundary. Replace fixtures with a typed API client when backend contracts exist. */
export function getContentItems(): ContentItem[] { return contentItems; }
export function getScheduleItems(): ScheduleItem[] { return scheduleItems; }
export function getContentQuickActions(): ContentQuickAction[] { return quickActions; }