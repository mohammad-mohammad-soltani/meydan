import { Icon } from "../icon";
export function ViewFeed() {
  return (
        <section id="view-feed" className="app-view space-y-0">
          <div id="feed-content-foryou" className="space-y-0 divide-y divide-slate-200 dark:divide-slate-800/80">
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
              <span className="flex items-center gap-1.5"><Icon name="bell-ring" className="w-4 h-4"  /> پژواک‌ها و روایت‌های برگزیده میادین</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">زنده</span>
            </div>
            {/* توییت ۱ */}
            <article className="feed-item feed-all feed-media p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex gap-2.5 cursor-pointer" data-action="switchView('view-combined-profile'); switchProfileSubtab('square');">
                  <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-xs shrink-0">
                    م.ا
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">پایگاه میدان انقلاب تهران</span>
                      <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">@tehran_enghelab · ۲۰ دقیقه پیش</span>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-brand-red px-1.5 py-0.5 rounded font-medium">روایت شب دوازدهم</span>
                  </div>
                </div>
              </div>
              <p data-action="openFullPostPage('پایگاه میدان انقلاب تهران', '@tehran_enghelab', 'امشب تجمع مردم با هم‌خوانی یکدست سرود «فرمانده کل قوا» برگزار شد. طومار ۵۰ متری تجدید بیعت نیز توسط بیش از ۲۰ هزار نفر از حاضرین امضا شد.', 'روزنامه عصر ایرانیان | عصر آنلاین', '۱.۱k', '۸۴', '۳', true)" className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-slate-950 dark:hover:text-white">
                امشب تجمع مردم با هم‌خوانی یکدست سرود «فرمانده کل قوا» برگزار شد. طومار ۵۰ متری تجدید بیعت نیز توسط بیش از ۲۰ هزار نفر از حاضرین امضا شد.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="camera" className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">عکس ۱ طومار</span>
                </div>
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="video" className="w-5 h-5 text-brand-red mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">ویدیو هم‌نوایی</span>
                </div>
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="newspaper" className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">صفحه ۵ عصر</span>
                </div>
              </div>
              <div className="media-reflection-card p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon name="newspaper" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"  />
                  <span className="min-w-0 flex-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    منتشر شده در: <b className="text-slate-900 dark:text-white">روزنامه عصر ایرانیان</b> و <b className="text-slate-900 dark:text-white">عصر آنلاین</b>
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 min-w-0">
                  <span className="min-w-0 flex-1 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">انعکاس رسانه‌ای · خبر رسمی</span>
                  <button data-action="openMediaModal('طومار ۵۰ متری تجدید بیعت در میدان انقلاب', 'عصر ایرانیان و عصر آنلاین')" className="text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0">
                    مشاهده خبر <Icon name="chevron-left" className="w-3 h-3"  />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <button data-action="toggleTweetAction(this, 'like')" className="flex items-center gap-1 hover:text-brand-red transition"><Icon name="heart" className="w-4 h-4"  /> <span>۱.۱k</span></button>
                <button data-action="toggleTweetAction(this, 'retweet')" className="flex items-center gap-1 hover:text-emerald-500 transition"><Icon name="repeat-2" className="w-4 h-4"  /> <span>۸۴</span></button>
                <button data-action="openFullPostPage('پایگاه میدان انقلاب تهران', '@tehran_enghelab', 'امشب تجمع مردم با هم‌خوانی یکدست سرود «فرمانده کل قوا» برگزار شد.', 'روزنامه عصر ایرانیان | عصر آنلاین', '۱.۱k', '۸۴', '۳', true)" className="flex items-center gap-1 hover:text-blue-500 transition"><Icon name="message-circle" className="w-4 h-4"  /> <span>۳</span></button>
                <button data-action="shareTweet('روایت میدان انقلاب تهران')" className="flex items-center gap-1 hover:text-amber-500 transition"><Icon name="share-2" className="w-4 h-4"  /></button>
              </div>
            </article>
            {/* توییت ۲ */}
            <article className="feed-item feed-all feed-ideas p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    یزد
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">میدان امیرچخماق یزد</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">@yazd_chakhmaq · ۴۵ دقیقه پیش</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 inline-flex">
                      <Icon name="sparkles" className="w-3.5 h-3.5"  /> پژواک ابتکار موفق میدانی
                    </span>
                  </div>
                </div>
              </div>
              <p data-action="openFullPostPage('میدان امیرچخماق یزد', '@yazd_chakhmaq', 'با کمک اصناف بازار، ایستگاه شارژ اضطراری موبایل و فلاسک‌های آب جوش صلواتی در ضلع شرقی میدان مستقر شد.', 'عصر آنلاین', '۶۷۰', '۵۱', '۰', false)" className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-slate-950 dark:hover:text-white">
                💡 با کمک اصناف بازار، «ایستگاه شارژ اضطراری موبایل و فلاسک‌های آب جوش صلواتی» در ضلع شرقی میدان مستقر شد تا در ساعات خاموشی هیچ تماسی قطع نماند. فایل راهنمای استقرار سریع ضمیمه شده است.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="zap" className="w-5 h-5 text-amber-500 mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">موتوربرق</span>
                </div>
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="coffee" className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">ایستگاه چای</span>
                </div>
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-1 text-center">
                  <Icon name="file-check" className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1"  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">نقشه سیم‌کشی</span>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-amber-700 dark:text-amber-400">شما هم این کار خوب را اجرا می‌کنید؟</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">تاکنون ۲۱ میدان دیگر پیوسته‌اند</div>
                </div>
                <button data-action="alert('پیوستن شما به ایده ثبت شد.');" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                  <Icon name="plus" className="w-3.5 h-3.5"  /> پیوستن به ایده
                </button>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <button data-action="toggleTweetAction(this, 'like')" className="flex items-center gap-1 hover:text-brand-red transition"><Icon name="heart" className="w-4 h-4"  /> <span>۶۷۰</span></button>
                <button data-action="toggleTweetAction(this, 'retweet')" className="flex items-center gap-1 hover:text-emerald-500 transition"><Icon name="repeat-2" className="w-4 h-4"  /> <span>۵۱</span></button>
                <button data-action="openFullPostPage('میدان امیرچخماق یزد', '@yazd_chakhmaq', 'با کمک اصناف بازار، ایستگاه شارژ اضطراری موبایل مستقر شد.', 'عصر آنلاین', '۶۷۰', '۵۱', '۰', false)" className="flex items-center gap-1 hover:text-blue-500 transition"><Icon name="message-circle" className="w-4 h-4"  /> <span>۰</span></button>
                <button data-action="shareTweet('پژواک میدان امیرچخماق یزد')" className="flex items-center gap-1 hover:text-amber-500 transition"><Icon name="share-2" className="w-4 h-4"  /></button>
              </div>
            </article>
          </div>
          <div id="feed-content-following" className="hidden space-y-3 p-3">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">پیشنهاد میادین برای دنبال کردن:</span>
                <span className="text-[10px] text-slate-400">مشاهده همه</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                <div className="shrink-0 w-28 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-brand-red/20 text-brand-red mx-auto flex items-center justify-center font-bold text-xs">مشهد</div>
                  <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">میدان شهدا</div>
                  <button data-action="toggleFollowBtn(this)" className="w-full bg-brand-red hover:bg-red-700 text-white text-[10px] font-bold py-1 rounded-lg transition">دنبال کردن</button>
                </div>
                <div className="shrink-0 w-28 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center font-bold text-xs">اصفهان</div>
                  <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">میدان امام</div>
                  <button data-action="toggleFollowBtn(this)" className="w-full bg-brand-red hover:bg-red-700 text-white text-[10px] font-bold py-1 rounded-lg transition">دنبال کردن</button>
                </div>
                <div className="shrink-0 w-28 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-xs">شیراز</div>
                  <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">شاهچراغ</div>
                  <button data-action="toggleFollowBtn(this)" className="w-full bg-brand-red hover:bg-red-700 text-white text-[10px] font-bold py-1 rounded-lg transition">دنبال کردن</button>
                </div>
              </div>
            </div>
          </div>
        </section>
  );
}
