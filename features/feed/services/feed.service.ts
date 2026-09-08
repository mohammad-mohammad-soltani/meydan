import type { FeedPost, FollowSuggestion } from "../types";

const feedPosts: FeedPost[] = [
  {
    id: "meydan-enghelab",
    kind: "media",
    squareName: "پایگاه میدان انقلاب تهران",
    handle: "tehran_enghelab",
    timeAgo: "۲۰ دقیقه پیش",
    city: "تهران",
    badge: "روایت شب دوازدهم",
    title: "پایگاه میدان انقلاب تهران",
    body: "امشب تجمع مردم با هم‌خوانی یکدست سرود «فرمانده کل قوا» برگزار شد. طومار ۵۰ متری تجدید بیعت نیز توسط بیش از ۲۰ هزار نفر از حاضرین امضا شد.",
    attachments: [
      { id: "enghelab-photo", label: "۱ عکس طومار", detail: "گزارش تصویری", icon: "image" },
      { id: "enghelab-video", label: "ویدیو هم‌نوایی", detail: "ویدیو", icon: "video" },
      { id: "enghelab-press", label: "صفحه ۵ عصر", detail: "روزنامه", icon: "article" }
    ],
    mediaReflection: {
      outlet: "روزنامه عصر ایرانیان",
      headline: "منتشر شده در روزنامه عصر ایرانیان و عصر آنلاین"
    },
    stats: { likes: 1100, comments: 3, reposts: 84 }
  },
  {
    id: "amir-chakhmaq",
    kind: "ideas",
    squareName: "میدان امیرچخماق یزد",
    handle: "yazd_chakhmaq",
    timeAgo: "۴۵ دقیقه پیش",
    city: "یزد",
    badge: "پژواک ابتکار موفق میدانی",
    title: "میدان امیرچخماق یزد",
    body: "با کمک اصناف بازار، ایستگاه شارژ اضطراری موبایل و فلاکس‌های آب برای مردم راه‌اندازی شد. این طرح با استقبال گسترده شهروندان روبه‌رو شد.",
    attachments: [
      { id: "yazd-power", label: "ایستگاه شارژ", detail: "ابتکار میدان", icon: "bolt" },
      { id: "yazd-audio", label: "گزارش صوتی", detail: "۳ دقیقه", icon: "microphone" }
    ],
    stats: { likes: 670, comments: 51, reposts: 0 },
    callToAction: "پیوستن به این ابتکار"
  }
];

const followSuggestions: FollowSuggestion[] = [
  { id: "mashhad-shohada", name: "میدان شهدای مشهد", city: "مشهد", handle: "mashhad_shohada", description: "گزارش‌های زنده از میدان" },
  { id: "isfahan-emam", name: "میدان امام اصفهان", city: "اصفهان", handle: "isfahan_emam", description: "شبکه مردمی میدان" },
  { id: "shiraz-shahcheragh", name: "میدان شاهچراغ شیراز", city: "شیراز", handle: "shiraz_shahcheragh", description: "روایت‌ها و برنامه‌های محلی" }
];

/** Data boundary for the feed. Replace these mock sources with an API client later. */
export async function getFeedPosts(): Promise<FeedPost[]> {
  return feedPosts;
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  return followSuggestions;
}