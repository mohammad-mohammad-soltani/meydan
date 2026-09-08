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
      {
        id: "enghelab-photo",
        label: "۱ عکس طومار",
        detail: "گزارش تصویری",
        icon: "image",
        previewSrc: "/images/generated/feed/enghelab-gathering.png",
        previewAlt: "مردم در تجمع شبانه میدان انقلاب در حال هم‌خوانی و امضای طومار"
      },
      { id: "enghelab-video", label: "ویدیو هم‌نوایی", detail: "ویدیو", icon: "video" },
      { id: "enghelab-press", label: "برای مشاهده کامل کلیک کنید", detail: "روزنامه", icon: "article" }
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
  },
  {
    id: "vali-asr-book-exchange",
    kind: "ideas",
    squareName: "پایگاه ولیعصر تهران",
    handle: "tehran_valiasr",
    timeAgo: "۱ ساعت پیش",
    city: "تهران",
    badge: "ابتکار شهروندی",
    title: "میز تبادل کتاب در پیاده‌راه ولیعصر",
    body: "دانشجویان و کتاب‌فروشان محلی، میز تبادل کتاب راه انداختند؛ هرکس می‌تواند یک کتاب بیاورد و با کتابی دیگر همراه شود.",
    attachments: [
      { id: "vali-asr-report", label: "گزارش میدانی", detail: "۵ دقیقه", icon: "article" },
      { id: "vali-asr-audio", label: "صدای شهروندان", detail: "۲ دقیقه", icon: "microphone" }
    ],
    stats: { likes: 428, comments: 27, reposts: 36 },
    callToAction: "ثبت کتاب برای تبادل"
  },
  {
    id: "shohada-mashhad",
    kind: "media",
    squareName: "میدان شهدای مشهد",
    handle: "mashhad_shohada",
    timeAgo: "۱ ساعت پیش",
    city: "مشهد",
    badge: "روایت زنده میدان",
    title: "گزارش عصرگاهی از میدان شهدا",
    body: "گروه‌های داوطلب، مسیرهای دسترسی و محل استقرار خدمات عمومی را برای مراجعه‌کنندگان راهنمایی کردند.",
    attachments: [
      { id: "mashhad-panorama", label: "۳ عکس میدان", detail: "گزارش تصویری", icon: "image" },
      { id: "mashhad-video", label: "ویدیوی کوتاه", detail: "۴۵ ثانیه", icon: "video" }
    ],
    mediaReflection: {
      outlet: "مشهد امروز",
      headline: "بازتاب خدمات داوطلبانه میدان شهدا در رسانه محلی"
    },
    stats: { likes: 892, comments: 44, reposts: 91 }
  },
  {
    id: "naqsh-jahan-cleanup",
    kind: "ideas",
    squareName: "میدان نقش جهان اصفهان",
    handle: "isfahan_emam",
    timeAgo: "۲ ساعت پیش",
    city: "اصفهان",
    badge: "همیاری محله",
    title: "پاک‌سازی مشارکتی مسیرهای اطراف میدان",
    body: "کسبه و ساکنان محله با تقسیم‌بندی مسیرها، پاک‌سازی عصرگاهی را به‌صورت هماهنگ انجام دادند و برای فردا هم گروه‌های جدید ثبت‌نام کردند.",
    attachments: [
      { id: "isfahan-checklist", label: "نقشه مسیرها", detail: "فایل راهنما", icon: "article" },
      { id: "isfahan-photo", label: "۲ عکس", detail: "گزارش تصویری", icon: "image" }
    ],
    stats: { likes: 512, comments: 19, reposts: 62 },
    callToAction: "ثبت‌نام گروه داوطلب"
  },
  {
    id: "shahcheragh-story",
    kind: "media",
    squareName: "پایگاه شاهچراغ شیراز",
    handle: "shiraz_shahcheragh",
    timeAgo: "۲ ساعت پیش",
    city: "شیراز",
    badge: "روایت مردم‌نگار",
    title: "روایت کاسب‌های گذر از یک عصر آرام",
    body: "چند نفر از کاسبان قدیمی گذر، از تغییرات محله و راه‌هایی گفتند که ارتباط همسایه‌ها را دوباره نزدیک‌تر کرده است.",
    attachments: [
      { id: "shiraz-voice", label: "گفت‌وگو با کاسبان", detail: "۶ دقیقه", icon: "microphone" },
      { id: "shiraz-portrait", label: "۴ عکس روایت", detail: "گالری", icon: "image" }
    ],
    mediaReflection: {
      outlet: "شیرازنامه",
      headline: "روایت کسب‌وکارهای محلی در گذر شاهچراغ"
    },
    stats: { likes: 768, comments: 38, reposts: 54 }
  },
  {
    id: "rasht-rain-shelter",
    kind: "ideas",
    squareName: "میدان شهرداری رشت",
    handle: "rasht_shahrdari",
    timeAgo: "۳ ساعت پیش",
    city: "رشت",
    badge: "راه‌حل محلی",
    title: "ایستگاه‌های امانت چتر در میدان شهرداری",
    body: "چند فروشگاه اطراف میدان با یک سامانه ساده امانت چتر موافقت کردند تا شهروندان در روزهای بارانی، مسیر کوتاه‌تری تا مقصد داشته باشند.",
    attachments: [
      { id: "rasht-guide", label: "راهنمای امانت", detail: "اطلاعیه", icon: "article" },
      { id: "rasht-demo", label: "ویدیوی راهنما", detail: "۱ دقیقه", icon: "video" }
    ],
    stats: { likes: 639, comments: 72, reposts: 48 },
    callToAction: "پیشنهاد محل جدید"
  },
  {
    id: "tabriz-crafts",
    kind: "media",
    squareName: "میدان ساعت تبریز",
    handle: "tabriz_saat",
    timeAgo: "۳ ساعت پیش",
    city: "تبریز",
    badge: "پژواک فرهنگ محلی",
    title: "نمایش کوچک صنایع‌دستی در میدان ساعت",
    body: "هنرمندان جوان تبریزی محصولات دست‌ساز خود را در غرفه‌های کوچک معرفی کردند و بخشی از درآمد را به آموزش هنر برای کودکان اختصاص دادند.",
    attachments: [
      { id: "tabriz-gallery", label: "۶ عکس", detail: "گالری صنایع‌دستی", icon: "image" },
      { id: "tabriz-interview", label: "گفت‌وگوی ویدیویی", detail: "۲ دقیقه", icon: "video" }
    ],
    stats: { likes: 724, comments: 31, reposts: 67 }
  },
  {
    id: "kerman-night-walk",
    kind: "ideas",
    squareName: "میدان ارگ کرمان",
    handle: "kerman_arg",
    timeAgo: "۴ ساعت پیش",
    city: "کرمان",
    badge: "مسیریابی امن",
    title: "مسیر پیاده‌روی شبانه با همراهان محله",
    body: "یک گروه مردمی برای ساعات شلوغ عصر، مسیرهای پیاده‌روی امن و روشن اطراف میدان را نشانه‌گذاری کرده و همراهی داوطلبانه ترتیب داده است.",
    attachments: [
      { id: "kerman-map", label: "نقشه مسیر امن", detail: "مسیرها", icon: "article" },
      { id: "kerman-audio", label: "توضیح برگزارکنندگان", detail: "۳ دقیقه", icon: "microphone" }
    ],
    stats: { likes: 383, comments: 22, reposts: 29 },
    callToAction: "اعلام آمادگی همراهی"
  },
  {
    id: "ahvaz-water-coolers",
    kind: "ideas",
    squareName: "میدان ساعت اهواز",
    handle: "ahvaz_saat",
    timeAgo: "۵ ساعت پیش",
    city: "اهواز",
    badge: "خدمت داوطلبانه",
    title: "تکمیل ایستگاه‌های آب خنک برای عابران",
    body: "پس از پیشنهاد چند شهروند، گروه‌های محلی مخزن‌های آب خنک را در سه نقطه پرتردد تکمیل کردند و برنامه نگهداری نوبتی ساختند.",
    attachments: [
      { id: "ahvaz-water-photo", label: "۱ عکس", detail: "گزارش میدان", icon: "image" },
      { id: "ahvaz-plan", label: "برنامه نگهداری", detail: "اطلاعیه", icon: "article" }
    ],
    stats: { likes: 946, comments: 66, reposts: 105 },
    callToAction: "همراهی در شیفت بعدی"
  },
  {
    id: "hamadan-story-circle",
    kind: "media",
    squareName: "میدان امام خمینی همدان",
    handle: "hamedan_emam",
    timeAgo: "۵ ساعت پیش",
    city: "همدان",
    badge: "قصه‌های میدان",
    title: "حلقه روایت‌خوانی در سایه میدان",
    body: "مردم از خاطره‌های کوتاه خود درباره محله گفتند و روایت‌ها به‌صورت صوتی ثبت شد تا برای برنامه‌های بعدی در دسترس همه باشد.",
    attachments: [
      { id: "hamadan-audio", label: "روایت صوتی", detail: "۸ دقیقه", icon: "microphone" },
      { id: "hamadan-photos", label: "۳ عکس", detail: "گزارش تصویری", icon: "image" }
    ],
    stats: { likes: 458, comments: 40, reposts: 32 }
  },
  {
    id: "bandarabbas-helpdesk",
    kind: "ideas",
    squareName: "میدان انقلاب بندرعباس",
    handle: "bandarabbas_enghelab",
    timeAgo: "۶ ساعت پیش",
    city: "بندرعباس",
    badge: "راهنمای شهروندی",
    title: "میز راهنمای خدمات شهری در میدان",
    body: "دانشجویان داوطلب با هماهنگی کسبه، میز راهنمای خدمات شهری راه انداختند تا مراجعه‌کنندگان سریع‌تر مسیر و شماره‌های ضروری را پیدا کنند.",
    attachments: [
      { id: "bandar-help-video", label: "ویدیوی معرفی", detail: "۷۰ ثانیه", icon: "video" },
      { id: "bandar-help-sheet", label: "فهرست خدمات", detail: "راهنما", icon: "article" }
    ],
    stats: { likes: 531, comments: 17, reposts: 41 },
    callToAction: "ارسال پیشنهاد خدمات"
  },
  {
    id: "ardabil-music",
    kind: "media",
    squareName: "میدان عالی‌قاپو اردبیل",
    handle: "ardabil_aliqapu",
    timeAgo: "۷ ساعت پیش",
    city: "اردبیل",
    badge: "نبض فرهنگی شهر",
    title: "اجرای موسیقی خیابانی با دعوت از کودکان",
    body: "گروه موسیقی محلی، بخشی از اجرا را به آموزش ریتم برای کودکان اختصاص داد؛ ویدیوهای کوتاه این بخش در صفحه میدان منتشر شده است.",
    attachments: [
      { id: "ardabil-performance", label: "ویدیوی اجرا", detail: "۲ دقیقه", icon: "video" },
      { id: "ardabil-photo", label: "۵ عکس", detail: "گالری", icon: "image" }
    ],
    mediaReflection: {
      outlet: "اردبیل امروز",
      headline: "بازتاب اجرای موسیقی محلی در میدان عالی‌قاپو"
    },
    stats: { likes: 1102, comments: 83, reposts: 130 }
  }
];

const followSuggestions: FollowSuggestion[] = [
  { id: "mashhad-shohada", name: "میدان شهدای مشهد", city: "مشهد", handle: "mashhad_shohada", description: "گزارش‌های زنده از میدان" },
  { id: "isfahan-emam", name: "میدان امام اصفهان", city: "اصفهان", handle: "isfahan_emam", description: "شبکه مردمی میدان" },
  { id: "shiraz-shahcheragh", name: "میدان شاهچراغ شیراز", city: "شیراز", handle: "shiraz_shahcheragh", description: "روایت‌ها و برنامه‌های محلی" },
  { id: "tabriz-saat", name: "میدان ساعت تبریز", city: "تبریز", handle: "tabriz_saat", description: "روایت‌های فرهنگ و شهر" },
  { id: "rasht-shahrdari", name: "میدان شهرداری رشت", city: "رشت", handle: "rasht_shahrdari", description: "ایده‌های روزمره شهروندی" }
];

/** Data boundary for the feed. Replace these mock sources with an API client later. */
export function getFeedPosts(): FeedPost[] {
  return feedPosts;
}

export function getFollowSuggestions(): FollowSuggestion[] {
  return followSuggestions;
}
