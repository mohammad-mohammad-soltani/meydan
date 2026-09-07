import { Icon } from "../icon";
export function ViewFullPost() {
  return (
        <section id="view-full-post" className="app-view hidden bg-white dark:bg-[#070a0f] min-h-screen flex flex-col flex-1">
          <div className="sticky top-0 bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur z-20 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button data-action="switchView('view-feed')" className="text-slate-500 hover:text-brand-red">
                <Icon name="arrow-right" className="w-5 h-5"  />
              </button>
              <span className="font-bold text-sm text-slate-900 dark:text-white">روایت میدان</span>
            </div>
            <span className="text-[10px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded font-bold" id="fullPostOutlet">انتشار رسمی</span>
          </div>
          <div className="p-4 space-y-4 flex-1">
            <div id="liveStreamBar" className="p-3 bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <div className="text-xs">
                  <div className="font-black">پخش زنده تجمعات و گفتگوی صوتی فعال است</div>
                  <div className="text-[10px] text-red-100">۸,۲۴۰ نفر هم‌اکنون در اتاق صوتی میدان</div>
                </div>
              </div>
              <button data-action="alert('اتصال به پخش زنده صوت و تصویر میدان برقرار شد.');" className="bg-white text-red-700 text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm hover:bg-red-50 transition shrink-0 flex items-center gap-1">
                <Icon name="radio" className="w-3.5 h-3.5"  /> ورود به لایو
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-xs">
                م.ا
              </div>
              <div>
                <div id="fullPostAuthor" className="font-bold text-sm text-slate-900 dark:text-white">پایگاه میدان انقلاب تهران</div>
                <div id="fullPostHandle" className="text-[11px] text-slate-400">@tehran_enghelab</div>
              </div>
            </div>
            <p id="fullPostContent" className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal pt-1">
              متن کامل توییت در این قسمت نمایش داده می‌شود.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400">
                <Icon name="camera" className="w-5 h-5 mb-1"  />
                <span>مستند ۱</span>
              </div>
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400">
                <Icon name="video" className="w-5 h-5 mb-1 text-brand-red"  />
                <span>مستند ۲</span>
              </div>
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400">
                <Icon name="newspaper" className="w-5 h-5 mb-1 text-blue-500"  />
                <span>مستند ۳</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs py-3 border-y border-slate-200 dark:border-slate-800">
              <button data-action="toggleTweetAction(this, 'like')" className="flex items-center gap-1 hover:text-brand-red transition"><Icon name="heart" className="w-4 h-4"  /> <span id="fullPostLikes">۱.۱k</span></button>
              <button data-action="toggleTweetAction(this, 'retweet')" className="flex items-center gap-1 hover:text-emerald-500 transition"><Icon name="repeat-2" className="w-4 h-4"  /> <span id="fullPostRetweets">۸۴</span></button>
              <span className="flex items-center gap-1 text-slate-400"><Icon name="message-circle" className="w-4 h-4"  /> <span id="fullPostReplies">۳</span></span>
              <button data-action="shareTweet('روایت میدان')" className="hover:text-amber-500 transition"><Icon name="share-2" className="w-4 h-4"  /></button>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Icon name="share-2" className="w-3.5 h-3.5 text-blue-500"  /> بازتاب در خبرگزاری‌ها و مطبوعات:
                </span>
                <span className="text-[10px] text-slate-400">کلیک برای مطالعه</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button data-action="showMediaReflection('روزنامه عصر ایرانیان', 'تیتر یک صفحه حوادث و سیاسی: طومار ۵۰ متری تجدید عهد مردم تهران در میدان انقلاب شکوه حضور را رقم زد. شماره ۴۸۱۲ مورخ ۲۱ رمضان.')" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-right transition flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">عصر</div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">روزنامه عصر ایرانیان</div>
                    <div className="text-[9px] text-slate-500 truncate">صفحه نخست · گزارش تفصیلی</div>
                  </div>
                </button>
                <button data-action="showMediaReflection('پایگاه خبری عصر آنلاین', 'گزارش تصویری کامل هم‌خوانی سرود فرمانده کل قوا در اجتماع شب دوازدهم میدان انقلاب.')" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-right transition flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">آنلاین</div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">عصر آنلاین</div>
                    <div className="text-[9px] text-slate-500 truncate">تیتر خبر فوری ۲۲:۱۰</div>
                  </div>
                </button>
                <button data-action="showMediaReflection('خبرگزاری فارس', 'بخش اجتماعی: ثبت امضای ده‌ها هزار نفر از جوانان بر طومار حمایت از مدافعان امنیت.')" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-right transition flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold text-xs">فارس</div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">خبرگزاری فارس</div>
                    <div className="text-[9px] text-slate-500 truncate">سرویس جامعه و میدان</div>
                  </div>
                </button>
                <button data-action="showMediaReflection('شبکه خبر صدا و سیما', 'پخش زنده و ارتباط مستقیم خبرنگار مستقر در میدان انقلاب تهران در بخش خبری ۲۱:۰۰.')" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500 text-right transition flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 text-brand-red flex items-center justify-center shrink-0 font-bold text-xs">IRIB</div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">شبکه خبر سیما</div>
                    <div className="text-[9px] text-slate-500 truncate">ارتباط زنده تصویری</div>
                  </div>
                </button>
              </div>
            </div>
            {/* بخش کامنت‌ها */}
            <div className="space-y-3 pt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                <span>نظرات و گفتگوها</span>
                <span className="text-slate-400 font-normal text-[11px]">(۳ نظر)</span>
              </div>
              <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                <div className="pt-2 flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0 text-slate-700 dark:text-slate-300">
                    ع.ح
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">علی حسینی (پایگاه میدان ولیعصر)</span>
                      <span className="text-[10px] text-slate-400">۱۵ دقیقه پیش</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      خداقوت به بچه‌های میدان انقلاب. طومار تجدید بیعت واقعاً حرکت چشمگیری بود؛ ما هم در میدان ولیعصر از امشب نمونه مشابه رو با همکاری پایگاه شروع کردیم.
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                      <button data-action="toggleTweetAction(this, 'like')" className="hover:text-brand-red flex items-center gap-1"><Icon name="heart" className="w-3.5 h-3.5"  /> <span>۱۴</span></button>
                      <button className="hover:text-blue-500">پاسخ</button>
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                    ص.م
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">صادق محمدی</span>
                      <span className="text-[10px] text-slate-400">۱۰ دقیقه پیش</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      صوت هم‌نوایی سرود فرمانده کل قوا کیفیتش عالی بود. آیا فایل ضبط‌شده مستقیم میکسر روی بخش محتوا قرار گرفته؟
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                      <button data-action="toggleTweetAction(this, 'like')" className="hover:text-brand-red flex items-center gap-1"><Icon name="heart" className="w-3.5 h-3.5"  /> <span>۸</span></button>
                      <button className="hover:text-blue-500">پاسخ</button>
                    </div>
                  </div>
                </div>
                <div className="pt-2 pr-6 flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    م.ا
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-red">پایگاه میدان انقلاب (نویسنده)</span>
                      <span className="text-[10px] text-slate-400">۵ دقیقه پیش</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      سلام بله، در بخش محتوا و صفحه اختصاصی پادکست‌ها فایل مستر با کیفیت ۳۲۰ بارگذاری شده و قابل دریافت است.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* باکس ارسال دیدگاه */}
          <div className="sticky bottom-0 w-full bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 z-30 flex items-center gap-2">
            <input type="text" id="postCommentInput" placeholder="پاسخ یا نظر خود را بنویسید..." className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red" />
            <button data-action="submitPostComment()" className="bg-brand-red hover:bg-red-700 text-white p-2.5 rounded-xl font-bold text-xs shrink-0 transition">
              <Icon name="send" className="w-4 h-4"  />
            </button>
          </div>
        </section>
  );
}
