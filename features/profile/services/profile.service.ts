import type { ProfileDetails } from "../types";

const profileDetails: ProfileDetails = {
  identity: { name: "پایگاه میدان انقلاب تهران", handle: "tehran_enghelab", subtitle: "پایگاه شماره ۱ تهران", location: "تهران · پایگاه فعال: میدان انقلاب", avatar: "🏛️", verified: true },
  squareStats: [
    { value: "۱۲ شب", label: "تجمع مستمر" },
    { value: "۴۵ هزار", label: "جمعیت امشب" },
    { value: "۱۸ خبر", label: "بازنشر رسانه‌ای", tone: "success" }
  ],
  resumeStats: [
    { value: "۳۵ منبر", label: "سخنرانی ایرادشده" },
    { value: "۱۴ یادداشت", label: "منتشرشده در مطبوعات" },
    { value: "سطح ۱", label: "رتبه تبیین‌گری", tone: "success" }
  ],
  schedule: [
    { id: "prayer", title: "نماز جماعت و قرائت قرآن", time: "۲۰:۳۰" },
    { id: "talk", title: "سخنرانی حجت‌الاسلام پناهیان", time: "۲۱:۰۰", highlighted: true },
    { id: "chant", title: "دم هم‌خوانی با حاج میثم مطیعی", time: "۲۱:۳۰" }
  ],
  activity: { id: "moakab-report", authorLabel: "ثبت‌شده توسط مسئول موکب", timeLabel: "دیشب ۲۲:۴۵", content: "توزیع ۱۰ هزار بسته چای و خرمای صلواتی در میان مادران و کودکان با نظم کامل انجام شد. سخنرانی حاج آقا پناهیان ضبط شده و روی رادیو میدان در حال بازپخش است.", tags: ["موکب مرکزی", "ضبط صوت", "توزیع نذورات"], likes: 450, reposts: 15, comments: 2 },
  about: "پژوهشگر حوزه امنیت ملی و پایداری اجتماعی. مسئول هماهنگی تریبون‌های آزاد و اعزام سخنرانان جوان به میادین شمال و مرکز تهران.",
  skills: ["تحلیل جنگ شناختی", "سخنرانی ۱۰ دقیقه‌ای منبر", "خبرنگاری میدانی"]
};

/** Profile data boundary. Replace with authenticated profile and activity endpoints. */
export function getProfileDetails(): ProfileDetails { return profileDetails; }