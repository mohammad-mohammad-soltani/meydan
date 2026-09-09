import { generatedMedia } from "@/components/shared/generated-media";
import Link from "next/link";
import { Icon } from "../icon";
export function ViewContent() {
  return (
        <section id="view-content" className="app-view hidden p-4 space-y-6">
          <Link href="/content/nahj-jihad" className="relative block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 cursor-pointer">
            <div className="relative h-52 w-full">
              <img src={generatedMedia.contentHero} alt="محتوا" className="w-full h-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-4 right-4 left-4 text-right space-y-1">
                <span className="inline-block bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                  منبر شبانه
                </span>
                <h2 className="text-white font-black text-base leading-tight">شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی</h2>
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                  شرح خطبه جهاد متناسب با روحیه ایستادگی و حضور سازمان‌یافته مردمی.
                </p>
              </div>
            </div>
          </Link>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <button data-action="switchView('view-speakers')" className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Icon name="mic" className="w-6 h-6"  />
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">اعزام سخنران</span>
              </button>
              <button data-action="openDetailModal('ارتباط با ما', 'راه‌های ارتباط با ستاد مرکزی قرارگاه میدانِ خیابان.')" className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Icon name="phone-call" className="w-6 h-6"  />
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">ارتباط با ما</span>
              </button>
              <button data-action="openDetailModal('چاپ پلاکارد سریع', 'فایل‌های لایه‌باز آماده چاپ افست و سیلک.')" className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Icon name="printer" className="w-6 h-6"  />
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">چاپ پلاکارد</span>
              </button>
              <button data-action="openDetailModal('راهنمای ایمنی میادین', 'دستورالعمل پدافند غیرعامل و اقدامات احتیاطی.')" className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-brand-red">
                  <Icon name="shield-alert" className="w-6 h-6"  />
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">راهنمای ایمنی</span>
              </button>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="calendar" className="w-4 h-4 text-brand-red"  /> روزشمار تجمعات شبانه
              </h3>
              <span className="text-[11px] text-brand-red font-bold">تمام ۴۰ شب</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              <div className="shrink-0 w-36 bg-gradient-to-br from-red-950 to-black text-white p-3 rounded-xl border border-red-900 flex flex-col justify-between h-28 relative cursor-pointer" data-action="openDetailModal('شب اول: خروش اولیه', 'آغاز تجمعات شبانه.')">
                <span className="text-[10px] text-red-300">شب اول</span>
                <span className="text-3xl font-black text-white/10 absolute -top-1 left-2 font-mono">۰۱</span>
                <div>
                  <div className="font-bold text-xs">شهدای رمضان</div>
                  <div className="text-[10px] text-slate-400">آغاز خروش خیابانی</div>
                </div>
              </div>
              <div className="shrink-0 w-36 bg-gradient-to-br from-red-700 to-red-950 text-white p-3 rounded-xl border-2 border-red-500 flex flex-col justify-between h-28 relative cursor-pointer" data-action="openDetailModal('امشب: تجدید بیعت', 'تجمع شب دوازدهم هم‌زمان در ۴۰۰ شهر.')">
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold self-start">امشب</span>
                <span className="text-3xl font-black text-white/20 absolute -top-1 left-2 font-mono">۱۲</span>
                <div>
                  <div className="font-bold text-xs">خونخواهی و بیعت</div>
                  <div className="text-[10px] text-slate-200">حضور ۴۰۰ شهر</div>
                </div>
              </div>
              <div className="shrink-0 w-36 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white p-3 rounded-xl flex flex-col justify-between h-28 relative cursor-pointer" data-action="openDetailModal('شب سیزدهم: مقاومت پایدار', 'تجدید عهد ملی.')">
                <span className="text-[10px] text-slate-500">شب سیزدهم</span>
                <span className="text-3xl font-black text-slate-300 dark:text-slate-800 absolute -top-1 left-2 font-mono">۱۳</span>
                <div>
                  <div className="font-bold text-xs">مقاومت پایدار</div>
                  <div className="text-[10px] text-slate-400">تجدید عهد ملی</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="book-open" className="w-4 h-4 text-amber-500"  /> سخنرانی‌های مکتوب
              </h3>
              <span className="text-[11px] text-slate-500">فیش ۱۰ دقیقه‌ای منبر</span>
            </div>
            <div className="space-y-2">
              <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={generatedMedia.avatarSpeaker} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">حجت‌الاسلام علیرضا پناهیان</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">مفهوم «میدانِ خیابان» در دفاع اجتماعی</p>
                  </div>
                </div>
                <Link href="/content/panahian-square" className="bg-slate-100 dark:bg-slate-900 hover:bg-brand-red hover:text-white text-slate-800 dark:text-slate-200 text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1">
                  <Icon name="file-text" className="w-3 h-3"  /> دریافت فیش
                </Link>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={generatedMedia.avatarCoordinator} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">استاد ناصر رفیعی</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">سیره اهل‌بیت در مواجهه با محاصره و بحران</p>
                  </div>
                </div>
                <Link href="/content/rafiei-crisis" className="bg-slate-100 dark:bg-slate-900 hover:bg-brand-red hover:text-white text-slate-800 dark:text-slate-200 text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1">
                  <Icon name="file-text" className="w-3 h-3"  /> دریافت فیش
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="music-2" className="w-4 h-4 text-emerald-500"  /> دم‌ها و سرودهای حماسی کشوری
              </h3>
              <button data-action="switchView('view-all-podcasts')" className="text-[11px] text-brand-red hover:underline font-bold flex items-center gap-0.5">
                <span>مشاهده بیشتر</span>
                <Icon name="chevron-left" className="w-3.5 h-3.5"  />
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <Link href="/content/farmandeh-song" aria-label="مشاهده جزئیات دم هماهنگ فرمانده کل قوا" className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2">
                <Icon name="info" className="w-5 h-5"  />
              </Link>
              <Link href="/content/farmandeh-song" className="text-right flex-1 pr-3 cursor-pointer">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">دم هماهنگ: «فرمانده کل قوا»</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">با نوای حاج میثم مطیعی · ۳ دقیقه</p>
              </Link>
              <button data-action="playAudio('فرمانده کل قوا')" className="w-11 h-11 rounded-full bg-brand-red text-white flex items-center justify-center shadow-md">
                <Icon name="play" className="w-5 h-5 fill-white mr-0.5"  />
              </button>
            </div>
          </div>
        </section>
  );
}
