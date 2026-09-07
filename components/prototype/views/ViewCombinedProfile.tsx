import { Icon } from "../icon";
export function ViewCombinedProfile() {
  return (
        <section id="view-combined-profile" className="app-view hidden space-y-0 pb-20">
          <div className="h-28 bg-gradient-to-r from-red-950 via-slate-900 to-black relative">
            <div className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-full text-white text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> هویت و پایگاه تاییدشده
            </div>
          </div>
          <div className="p-4 relative">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white dark:border-[#070a0f] absolute -top-8 right-4 flex items-center justify-center text-white font-black text-xl shadow-md overflow-hidden">
              <span id="profileAvatarIcon">🏛️</span>
            </div>
            {/* دکمه‌های فالو و چت بالای پروفایل */}
            <div className="flex justify-end items-center gap-2 pt-1 pb-3">
              <button data-action="openDirectChatPage('پایگاه میدان انقلاب', '@tehran_enghelab')" className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:border-brand-red hover:text-brand-red transition">
                <Icon name="mail" className="w-4 h-4"  />
              </button>
              <button data-action="toggleFollowBtn(this)" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full transition shadow-sm">
                دنبال کردن
              </button>
            </div>
            <div className="pt-2 space-y-3">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
                <button data-action="switchProfileSubtab('resume')" id="btn-subtab-resume" className="flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 transition flex items-center justify-center gap-1.5">
                  <Icon name="user-check" className="w-4 h-4"  />
                  رزومه شخصی من
                </button>
                <button data-action="switchProfileSubtab('square')" id="btn-subtab-square" className="flex-1 py-2 rounded-lg subtab-active transition flex items-center justify-center gap-1.5">
                  <Icon name="shield" className="w-4 h-4"  />
                  پایگاه میدان من
                </button>
              </div>
              {/* پایگاه میدان من */}
              <div id="subtab-content-square" className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 id="mySquareTitle" className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      پایگاه میدان انقلاب تهران
                      <Icon name="badge-check" className="w-4 h-4 text-blue-500 fill-blue-500"  />
                    </h2>
                    <p id="mySquareHandle" className="text-xs text-slate-400">@tehran_enghelab · پایگاه شماره ۱ تهران</p>
                  </div>
                  <button data-action="openDetailModal('مدیریت میدانی پایگاه', 'پنل هماهنگی صوت، موکب، رزرو سخنران و ثبت اخبار رسمی.')" className="bg-brand-red text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow">
                    + مدیریت میدان
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">۱۲ شب</div>
                    <div className="text-[10px] text-slate-400">تجمع مستمر</div>
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">۴۵ هزار</div>
                    <div className="text-[10px] text-slate-400">جمعیت امشب</div>
                  </div>
                  <div>
                    <div className="font-black text-sm text-emerald-500">۱۸ خبر</div>
                    <div className="text-[10px] text-slate-400">بازنشر رسانه‌ای</div>
                  </div>
                </div>
                {/* جدول امشب میدان */}
                <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <Icon name="clock" className="w-4 h-4 text-brand-red"  />
                    <span>جدول امشب میدان:</span>
                  </div>
                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span>نماز جماعت و قرائت قرآن</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">ساعت ۲۰:۳۰</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 text-amber-600 dark:text-amber-400 font-bold">
                      <span>سخنرانی حجت‌الاسلام پناهیان</span>
                      <span className="font-mono">ساعت ۲۱:۰۰</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>دم هم‌خوانی با حاج میثم مطیعی</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">ساعت ۲۱:۳۰</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">روایت‌های ثبت‌شده این پایگاه:</span>
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ثبت‌شده توسط مسئول موکب
                      </span>
                      <span>دیشب ۲۲:۴۵</span>
                    </div>
                    <p data-action="openFullPostPage('پایگاه میدان انقلاب', '@tehran_enghelab', 'توزیع ۱۰ هزار بسته چای و خرمای صلواتی در میان مادران و کودکان با نظم کامل انجام شد.', 'روزنامه عصر ایرانیان', '۴۵۰', '۱۵', '۲', true)" className="text-slate-700 dark:text-slate-200 leading-relaxed cursor-pointer hover:underline">
                      «توزیع ۱۰ هزار بسته چای و خرمای صلواتی در میان مادران و کودکان با نظم کامل انجام شد. سخنرانی حاج آقا پناهیان ضبط شده و روی رادیو میدان در حال بازپخش است.»
                    </p>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded text-[9px] text-slate-700 dark:text-slate-300">موکب مرکزی</div>
                      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded text-[9px] text-slate-700 dark:text-slate-300">ضبط صوت</div>
                      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded text-[9px] text-slate-700 dark:text-slate-300">توزیع نذورات</div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                      <button data-action="toggleTweetAction(this, 'like')" className="flex items-center gap-1 hover:text-brand-red"><Icon name="heart" className="w-3.5 h-3.5"  /> <span>۴۵۰</span></button>
                      <button data-action="toggleTweetAction(this, 'retweet')" className="flex items-center gap-1 hover:text-emerald-500"><Icon name="repeat-2" className="w-3.5 h-3.5"  /> <span>۱۵</span></button>
                      <button data-action="openFullPostPage('پایگاه میدان انقلاب', '@tehran_enghelab', 'توزیع ۱۰ هزار بسته چای و خرما...', 'روزنامه عصر ایرانیان', '۴۵۰', '۱۵', '۲', true)" className="flex items-center gap-1 hover:text-blue-500"><Icon name="message-circle" className="w-3.5 h-3.5"  /> <span>۲</span></button>
                      <button data-action="shareTweet('گزارش موکب میدان انقلاب')" className="hover:text-amber-500"><Icon name="share-2" className="w-3.5 h-3.5"  /></button>
                    </div>
                  </div>
                </div>
              </div>
              {/* رزومه شخصی کامل */}
              <div id="subtab-content-resume" className="hidden space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      محمدصادق رضایی
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">عضو فعال تبیین</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">کارشناس ارشد علوم سیاسی | فعال رسانه و میدان</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">تهران · پایگاه فعال: میدان انقلاب</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">۳۵ منبر</div>
                    <div className="text-[9px] text-slate-400">سخنرانی ایرادشده</div>
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">۱۴ یادداشت</div>
                    <div className="text-[9px] text-slate-400">منتشرشده در مطبوعات</div>
                  </div>
                  <div>
                    <div className="font-black text-emerald-500">سطح ۱</div>
                    <div className="text-[9px] text-slate-400">رتبه تبیین‌گری</div>
                  </div>
                </div>
                {/* آکاردئون‌ها */}
                <div className="space-y-2 pt-1">
                  {/* خلاصه سوابق و درباره من */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <button data-action="toggleAccordion('acc-about')" className="w-full bg-slate-50 dark:bg-slate-900/60 p-3.5 text-xs font-bold text-slate-900 dark:text-white flex justify-between items-center">
                      <span>خلاصه سوابق و درباره من</span>
                      <i id="acc-about-icon" data-lucide="chevron-down" className="w-4 h-4 transition-transform" />
                    </button>
                    <div id="acc-about" className="p-3.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#070a0f] border-t border-slate-100 dark:border-slate-800/80">
                      پژوهشگر حوزه امنیت ملی و پایداری اجتماعی. مسئول هماهنگی تریبون‌های آزاد و اعزام سخنرانان جوان به میادین شمال و مرکز تهران.
                    </div>
                  </div>
                  {/* مهارت‌ها و نشان‌های تخصصی */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <button data-action="toggleAccordion('acc-skills')" className="w-full bg-slate-50 dark:bg-slate-900/60 p-3.5 text-xs font-bold text-slate-900 dark:text-white flex justify-between items-center">
                      <span>مهارت‌ها و نشان‌های تخصصی</span>
                      <i id="acc-skills-icon" data-lucide="chevron-down" className="w-4 h-4 transition-transform" />
                    </button>
                    <div id="acc-skills" className="p-3.5 bg-white dark:bg-[#070a0f] border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium">تحلیل جنگ شناختی</span>
                        <span className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium">سخنرانی ۱۰ دقیقه‌ای منبر</span>
                        <span className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium">خبرنگاری میدانی</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  );
}
