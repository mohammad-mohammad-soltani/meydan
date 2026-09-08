import type { PostDetail } from "../types";

const posts: Record<string, PostDetail> = {
  "meydan-enghelab": {
    id: "meydan-enghelab",
    author: { name: "پایگاه میدان انقلاب تهران", handle: "tehran_enghelab", initials: "م.ا", verified: true },
    outlet: "روزنامه عصر ایرانیان",
    badge: "روایت شب دوازدهم",
    timeAgo: "۲۰ دقیقه پیش",
    body: "امشب تجمع مردم با هم‌خوانی یکدست سرود «فرمانده کل قوا» برگزار شد. طومار ۵۰ متری تجدید بیعت نیز توسط بیش از ۲۰ هزار نفر از حاضرین امضا شد.",
    media: [
      { id: "photo", label: "۱ عکس طومار", detail: "گزارش تصویری", kind: "image", previewSrc: "/images/generated/feed/enghelab-gathering.png", previewAlt: "مردم در تجمع شبانه میدان انقلاب در حال هم‌خوانی و امضای طومار" },
      { id: "video", label: "ویدیو هم‌نوایی", detail: "ویدیو", kind: "video", previewSrc: "/images/generated/feed/enghelab-gathering.png", previewAlt: "پیش‌نمایش ویدیوی هم‌خوانی در میدان انقلاب" },
      { id: "press", label: "برای مشاهده کامل کلیک کنید", detail: "روزنامه", kind: "article" }
    ],
    reflections: [{ id: "asr-iranian", outlet: "روزنامه عصر ایرانیان", summary: "تیتر یک صفحه حوادث و سیاسی: طومار ۵۰ متری تجدید عهد مردم تهران در میدان انقلاب شکوه حضور را رقم زد.", accent: "blue" }, { id: "asr-online", outlet: "پایگاه خبری عصر آنلاین", summary: "گزارش تصویری کامل هم‌خوانی سرود فرمانده کل قوا در اجتماع شب دوازدهم میدان انقلاب.", accent: "emerald" }, { id: "fars", outlet: "خبرگزاری فارس", summary: "ثبت امضای ده‌ها هزار نفر از جوانان بر طومار حمایت از مدافعان امنیت.", accent: "amber" }, { id: "irib", outlet: "شبکه خبر سیما", summary: "پخش زنده و ارتباط مستقیم خبرنگار مستقر در میدان انقلاب تهران.", accent: "red" }],
    likes: 1100,
    reposts: 84,
    comments: [{ id: "ali", author: "علی حسینی (پایگاه میدان ولیعصر)", initials: "ع.ح", timeAgo: "۱۵ دقیقه پیش", content: "خداقوت به بچه‌های میدان انقلاب. طومار تجدید بیعت واقعاً حرکت چشمگیری بود؛ ما هم در میدان ولیعصر نمونه مشابه را شروع کردیم." }, { id: "sadegh", author: "صادق محمدی", initials: "ص.م", timeAgo: "۱۰ دقیقه پیش", content: "صوت هم‌نوایی سرود فرمانده کل قوا کیفیتش عالی بود. آیا فایل ضبط‌شده مستقیم میکسر روی بخش محتوا قرار گرفته؟" }, { id: "author-reply", author: "پایگاه میدان انقلاب (نویسنده)", initials: "م.ا", timeAgo: "۵ دقیقه پیش", content: "بله، در بخش محتوا و صفحه اختصاصی پادکست‌ها فایل مستر با کیفیت ۳۲۰ بارگذاری شده و قابل دریافت است.", isAuthor: true }]
  },
  "amir-chakhmaq": {
    id: "amir-chakhmaq",
    author: { name: "میدان امیرچخماق یزد", handle: "yazd_chakhmaq", initials: "ی.ز", verified: true },
    outlet: "شبکه مردمی یزد",
    badge: "پژواک ابتکار موفق میدانی",
    timeAgo: "۴۵ دقیقه پیش",
    body: "با کمک اصناف بازار، ایستگاه شارژ اضطراری موبایل و فلاکس‌های آب برای مردم راه‌اندازی شد. این طرح با استقبال گسترده شهروندان روبه‌رو شد.",
    media: [{ id: "power", label: "ایستگاه شارژ", kind: "image" }, { id: "audio", label: "گزارش صوتی", kind: "video" }, { id: "document", label: "راهنمای اجرا", kind: "article" }],
    reflections: [{ id: "yazd-local", outlet: "رسانه محلی یزد", summary: "پویش کسبه بازار برای خدمت‌رسانی به مردم میدان امیرچخماق.", accent: "amber" }],
    likes: 670,
    reposts: 0,
    comments: []
  },
  "moakab-report": {
    id: "moakab-report",
    author: { name: "پایگاه میدان انقلاب تهران", handle: "tehran_enghelab", initials: "م.ا", verified: true },
    outlet: "گزارش پایگاه",
    badge: "ثبت‌شده توسط مسئول موکب",
    timeAgo: "۱ ساعت پیش",
    body: "توزیع ۱۰ هزار بسته چای و خرمای صلواتی در میان مادران و کودکان با نظم کامل انجام شد. سخنرانی حاج آقا پناهیان ضبط شده و روی رادیو میدان در حال بازپخش است.",
    media: [{ id: "tea", label: "موکب مرکزی", kind: "image" }, { id: "recording", label: "ضبط صوت", kind: "video" }, { id: "distribution", label: "توزیع نذورات", kind: "article" }],
    reflections: [],
    likes: 450,
    reposts: 15,
    comments: []
  }
};

/** Posts data boundary. Replace fixture lookups with a typed server/API client. */
export function getPostById(postId: string): PostDetail | null { return posts[postId] ?? null; }
