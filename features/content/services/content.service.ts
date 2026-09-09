import type { ContentDetailItem, ContentItem, ContentQuickAction, ScheduleItem } from "../types";

const contentItems: ContentItem[] = [
  { id: "nahj-jihad", category: "featured", status: "urgent", badge: "منبر شبانه", title: "شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی", subtitle: "شرح خطبه جهاد متناسب با روحیه ایستادگی", description: "صوت و متن بیانات پیرامون پایداری در نبرد تبیین و حضور سازمان‌یافته مردمی.", media: { kind: "image", description: "تصویر و متن ویژه" } },
  { id: "panahian-square", category: "talks", status: "ready", title: "مفهوم «میدانِ خیابان» در دفاع اجتماعی", subtitle: "فیش ۱۰ دقیقه‌ای منبر", description: "سرفصل‌های تبیین میدانِ خیابان برای استفاده در جمع‌های مردمی.", author: "حجت‌الاسلام علیرضا پناهیان", media: { kind: "document", description: "فیش منبر" } },
  { id: "rafiei-crisis", category: "talks", status: "ready", title: "سیره اهل‌بیت در مواجهه با محاصره و بحران", subtitle: "فیش ۱۰ دقیقه‌ای منبر", description: "استناد به آیات سوره احزاب و مسیر مواسات در بحران.", author: "استاد ناصر رفیعی", media: { kind: "document", description: "فیش منبر" } },
  { id: "farmandeh-song", category: "audio", status: "ready", title: "دم هماهنگ: «فرمانده کل قوا»", subtitle: "با نوای حاج میثم مطیعی", description: "اجرا شده در اجتماع ۳۰ هزار نفری میدان انقلاب تهران؛ شب دوازدهم.", media: { kind: "audio", duration: "۳ دقیقه", description: "دم و سرود حماسی" } }
];

const contentDetailItems: ContentDetailItem[] = [
  {
    id: "nahj-jihad",
    category: "featured",
    status: "urgent",
    badge: "پیشنهاد امشب",
    title: "شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی",
    subtitle: "شرح خطبه جهاد متناسب با روحیه ایستادگی",
    description: "بسته‌ای آماده برای روایت پایداری در نبرد تبیین و حضور سازمان‌یافته مردمی؛ شامل متن کامل، پوستر و نسخه مناسب انتشار.",
    author: "حجت‌الاسلام علیرضا پناهیان",
    media: { kind: "image", description: "تصویر، متن و فایل آماده انتشار", coverImage: "/images/generated/content-hero.svg" },
    creator: {
      name: "حجت‌الاسلام علیرضا پناهیان",
      role: "سخنران و پژوهشگر معارف اسلامی",
      avatar: "/images/generated/avatar-speaker.svg",
      bio: "مجموعه بیانات و فیش‌های کوتاه برای استفاده در جمع‌های مردمی و منبرهای مناسبتی.",
      publishedCount: "۲۸ محتوای منتشرشده",
    },
    publishedAt: "۱۸ شهریور ۱۴۰۵",
    location: "تهران، میدان انقلاب",
    viewCount: "۱۲٫۴ هزار",
    downloadCount: "۳٫۱ هزار",
    body: [
      "این بسته با محوریت فرازهایی از خطبه جهاد نهج‌البلاغه آماده شده و تلاش می‌کند نسبت میان ایستادگی فردی، مسئولیت اجتماعی و حضور آگاهانه در میدان را روشن کند.",
      "متن اصلی به‌صورت فیش‌بندی‌شده تنظیم شده تا سخنران بتواند در یک ارائه کوتاه از آن استفاده کند. نسخه تصویری نیز برای انتشار در شبکه‌های اجتماعی و نمایش روی پرده در اختیار گروه‌های میدانی قرار گرفته است.",
    ],
    tags: ["نهج‌البلاغه", "جهاد تبیین", "منبر شبانه", "ایستادگی"],
    files: [
      { id: "poster", label: "پوستر اصلی", format: "JPG", size: "۴٫۸ مگابایت", detail: "کیفیت چاپ، ۳۰۰dpi" },
      { id: "social", label: "نسخه شبکه اجتماعی", format: "PNG", size: "۱٫۲ مگابایت", detail: "نسبت ۴:۵، مناسب انتشار" },
      { id: "text", label: "متن کامل سخنرانی", format: "PDF", size: "۸۴۰ کیلوبایت", detail: "۱۲ صفحه، نسخه مطالعه" },
    ],
    usageNote: "بازنشر این محتوا با ذکر نام تولیدکننده و نشان «میدان خیابان» آزاد است.",
  },
  {
    id: "panahian-square",
    category: "talks",
    status: "ready",
    badge: "فیش منبر",
    title: "مفهوم «میدانِ خیابان» در دفاع اجتماعی",
    subtitle: "فیش ۱۰ دقیقه‌ای منبر",
    description: "سرفصل‌های تبیین میدانِ خیابان برای استفاده در جمع‌های مردمی و حلقه‌های گفتگو.",
    author: "حجت‌الاسلام علیرضا پناهیان",
    media: { kind: "document", description: "فیش منبر و نسخه چاپی" },
    creator: {
      name: "حجت‌الاسلام علیرضا پناهیان",
      role: "سخنران و پژوهشگر معارف اسلامی",
      avatar: "/images/generated/avatar-speaker.svg",
      bio: "مجموعه بیانات و فیش‌های کوتاه برای استفاده در جمع‌های مردمی و منبرهای مناسبتی.",
      publishedCount: "۲۸ محتوای منتشرشده",
    },
    publishedAt: "۱۷ شهریور ۱۴۰۵",
    viewCount: "۸٫۷ هزار",
    downloadCount: "۲٫۲ هزار",
    body: [
      "این فیش، مفهوم میدان خیابان را به‌عنوان فضای شکل‌گیری اعتماد عمومی و همکاری اجتماعی توضیح می‌دهد.",
      "ساختار متن برای یک ارائه ۱۰ دقیقه‌ای طراحی شده و شامل مقدمه، سه محور اصلی، شواهد پیشنهادی و جمع‌بندی است.",
    ],
    tags: ["دفاع اجتماعی", "فیش منبر", "مشارکت مردمی"],
    files: [
      { id: "pdf", label: "نسخه آماده مطالعه", format: "PDF", size: "۷۲۰ کیلوبایت", detail: "۸ صفحه، اندازه A4" },
      { id: "docx", label: "نسخه قابل ویرایش", format: "DOCX", size: "۱۸۰ کیلوبایت", detail: "مناسب یادداشت‌گذاری سخنران" },
    ],
    usageNote: "استفاده در منبر، حلقه‌های گفتگو و بازنشر غیرتجاری با ذکر منبع آزاد است.",
  },
  {
    id: "rafiei-crisis",
    category: "talks",
    status: "ready",
    badge: "فیش منبر",
    title: "سیره اهل‌بیت در مواجهه با محاصره و بحران",
    subtitle: "فیش ۱۰ دقیقه‌ای منبر",
    description: "استناد به آیات سوره احزاب و مسیر مواسات، امید اجتماعی و مسئولیت جمعی در بحران.",
    author: "استاد ناصر رفیعی",
    media: { kind: "document", description: "متن پژوهشی و فیش سخنرانی" },
    creator: {
      name: "استاد ناصر رفیعی",
      role: "پژوهشگر تاریخ و معارف اسلامی",
      avatar: "/images/generated/avatar-coordinator.svg",
      bio: "پژوهش و تولید محتوای کاربردی برای سخنرانی‌های مناسبتی و گفت‌وگوهای اجتماعی.",
      publishedCount: "۱۹ محتوای منتشرشده",
    },
    publishedAt: "۱۶ شهریور ۱۴۰۵",
    viewCount: "۶٫۳ هزار",
    downloadCount: "۱٫۸ هزار",
    body: [
      "این متن با مرور نمونه‌هایی از سیره اهل‌بیت، شیوه حفظ انسجام اجتماعی در دوره‌های فشار و محاصره را بررسی می‌کند.",
      "در پایان هر بخش، یک پیشنهاد عملی برای تبدیل مفاهیم تاریخی به کنش جمعی امروز ارائه شده است.",
    ],
    tags: ["سیره اهل‌بیت", "مواسات", "بحران", "امید اجتماعی"],
    files: [
      { id: "brief", label: "فیش سخنرانی", format: "PDF", size: "۹۶۰ کیلوبایت", detail: "۱۰ صفحه، نسخه نهایی" },
      { id: "references", label: "آیات و منابع", format: "PDF", size: "۴۶۰ کیلوبایت", detail: "فهرست منابع تکمیلی" },
    ],
    usageNote: "نقل بخش‌هایی از متن با حفظ امانت و ذکر نام صاحب اثر مجاز است.",
  },
  {
    id: "farmandeh-song",
    category: "audio",
    status: "ready",
    badge: "صوت منتخب",
    title: "دم هماهنگ: «فرمانده کل قوا»",
    subtitle: "با نوای حاج میثم مطیعی",
    description: "اجرای جمعی در اجتماع ۳۰ هزار نفری میدان انقلاب تهران؛ آماده پخش و همخوانی در برنامه‌های میدانی.",
    author: "حاج میثم مطیعی",
    media: { kind: "audio", duration: "۳:۱۲", description: "دم و سرود حماسی" },
    creator: {
      name: "حاج میثم مطیعی",
      role: "مداح و تولیدکننده محتوای آیینی",
      avatar: "/images/generated/avatar-speaker.svg",
      bio: "آثار صوتی و آیینی مناسب همخوانی جمعی و اجتماعات بزرگ مردمی.",
      publishedCount: "۳۶ محتوای منتشرشده",
    },
    publishedAt: "۱۵ شهریور ۱۴۰۵",
    location: "میدان انقلاب تهران، شب دوازدهم",
    viewCount: "۲۴٫۹ هزار",
    downloadCount: "۸٫۶ هزار",
    body: [
      "نسخه اصلی این قطعه از اجرای زنده اجتماع شب دوازدهم تهیه شده است. تدوین صوتی به‌گونه‌ای انجام شده که صدای جمعیت و ریتم همخوانی برای تمرین گروه‌ها واضح باشد.",
      "برای اجرای میدانی، نسخه بدون مقدمه پیشنهاد می‌شود. متن همخوانی نیز به‌صورت جداگانه در فایل‌های دانلود قرار دارد.",
    ],
    tags: ["سرود", "همخوانی", "میدان انقلاب", "صوت"],
    files: [
      { id: "mp3", label: "نسخه اصلی", format: "MP3", size: "۷٫۴ مگابایت", detail: "کیفیت ۳۲۰kbps" },
      { id: "mobile", label: "نسخه کم‌حجم", format: "MP3", size: "۲٫۱ مگابایت", detail: "مناسب پیام‌رسان‌ها" },
      { id: "lyrics", label: "متن همخوانی", format: "PDF", size: "۳۲۰ کیلوبایت", detail: "نسخه مناسب چاپ" },
    ],
    usageNote: "پخش عمومی و بازنشر این اثر در برنامه‌های مردمی با ذکر اجراکننده مجاز است.",
  },
  {
    id: "enghelab-night-video",
    category: "video",
    status: "ready",
    badge: "روایت تصویری",
    title: "روایت یک شب همدلی در میدان انقلاب",
    subtitle: "گزارش کوتاه از آماده‌سازی تا همخوانی جمعی",
    description: "روایتی سه‌دقیقه‌ای از پشت صحنه، حضور خانواده‌ها و شکل‌گیری یک اجرای جمعی در میدان.",
    author: "گروه رسانه میدان خیابان",
    media: { kind: "video", duration: "۲:۴۸", description: "ویدئوی افقی و عمودی", coverImage: "/images/generated/feed/enghelab-gathering.png" },
    creator: {
      name: "گروه رسانه میدان خیابان",
      role: "تیم روایت و مستندسازی مردمی",
      avatar: "/images/generated/avatar-journalist.svg",
      bio: "ثبت و روایت تجربه‌های جمعی شهرها با تمرکز بر آدم‌ها، جزئیات و قصه‌های میدان.",
      publishedCount: "۴۲ محتوای منتشرشده",
    },
    publishedAt: "۱۴ شهریور ۱۴۰۵",
    location: "تهران، میدان انقلاب",
    viewCount: "۱۸٫۲ هزار",
    downloadCount: "۴٫۷ هزار",
    body: [
      "این ویدئو از چند ساعت پیش از آغاز برنامه شروع می‌شود و آماده‌سازی گروه‌های داوطلب، رسیدن خانواده‌ها و لحظه همخوانی پایانی را دنبال می‌کند.",
      "دو خروجی افقی و عمودی برای نمایش روی پرده و انتشار در شبکه‌های اجتماعی آماده شده است.",
    ],
    tags: ["روایت تصویری", "مستند کوتاه", "میدان انقلاب"],
    files: [
      { id: "landscape", label: "نسخه افقی", format: "MP4", size: "۱۴۸ مگابایت", detail: "Full HD، نسبت ۱۶:۹" },
      { id: "vertical", label: "نسخه عمودی", format: "MP4", size: "۹۶ مگابایت", detail: "Full HD، نسبت ۹:۱۶" },
      { id: "subtitle", label: "زیرنویس فارسی", format: "SRT", size: "۱۸ کیلوبایت", detail: "هماهنگ با هر دو نسخه" },
    ],
    usageNote: "بازنشر کامل ویدئو بدون تغییر نشان و تیتراژ پایانی مجاز است.",
  },
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
export function getContentDetailItems(): ContentDetailItem[] { return contentDetailItems; }
export function getContentDetailById(id: string): ContentDetailItem | undefined { return contentDetailItems.find((item) => item.id === id); }
export function getScheduleItems(): ScheduleItem[] { return scheduleItems; }
export function getContentQuickActions(): ContentQuickAction[] { return quickActions; }
