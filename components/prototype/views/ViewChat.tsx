import { Icon } from "../icon";
export function ViewChat() {
  return (
        <section id="view-chat" className="app-view hidden p-4 space-y-4 pb-20">
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button data-action="switchChatSection('messages')" id="chat-tab-messages" className="flex-1 py-2.5 text-center tab-active transition">گفتگوها</button>
            <button data-action="switchChatSection('notifs')" id="chat-tab-notifs" className="flex-1 py-2.5 text-center text-slate-500 dark:text-slate-400 transition flex items-center justify-center gap-1">
              <span>اعلان‌ها</span>
              <span className="w-2 h-2 rounded-full bg-brand-red" />
            </button>
          </div>
          {/* لیست گفتگوها */}
          <div id="chat-section-messages" className="space-y-2.5">
            <div data-action="openDirectChatPage('پایگاه میدان انقلاب', '@tehran_enghelab')" className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shrink-0">
                  م.ا
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    پایگاه میدان انقلاب
                    <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">هماهنگی برای منبر ساعت ۲۱ نهایی شد.</div>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">۱۰ دقیقه</span>
            </div>
            <div data-action="openDirectChatPage('موکب امیرچخماق یزد', '@yazd_chakhmaq')" className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  یزد
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    موکب امیرچخماق یزد
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">نقشه سیم‌کشی ارسال شد خداقوت.</div>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">۳۵ دقیقه</span>
            </div>
          </div>
          {/* بخش اعلان‌ها با انواع متنوع شبیه توییتر (لایک، ریتوییت، منشن، پیام، بازتاب رسانه، فالو) */}
          <div id="chat-section-notifs" className="hidden space-y-2.5">
            {/* اعلان ۱: لایک */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer">
              <div className="p-2 rounded-xl bg-red-500/10 text-brand-red shrink-0">
                <Icon name="heart" className="w-5 h-5 fill-red-500"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">پسندیده شدن روایت شما</span>
                  <span className="text-[9px] text-slate-400 font-mono">۱۲ دقیقه پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <b>پایگاه میدان شهدا مشهد</b> و ۸۴ نفر دیگر روایت «طومار ۵۰ متری تجدید بیعت» را پسندیدند.
                </p>
              </div>
            </div>
            {/* اعلان ۲: بازنشر / ریتوییت */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Icon name="repeat-2" className="w-5 h-5"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">بازنشر (پژواک) روایت</span>
                  <span className="text-[9px] text-slate-400 font-mono">۲۸ دقیقه پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <b>موکب امیرچخماق یزد</b> روایت میدانی شما را در فید اختصاصی خود بازنشر کرد.
                </p>
              </div>
            </div>
            {/* اعلان ۳: پیام مستقیم دریافتی */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer" data-action="openDirectChatPage('پایگاه میدان انقلاب', '@tehran_enghelab')">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                <Icon name="message-square" className="w-5 h-5"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">پیام مستقیم جدید</span>
                  <span className="text-[9px] text-slate-400 font-mono">۴۰ دقیقه پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <b>پایگاه میدان انقلاب:</b> «هماهنگی برای منبر ساعت ۲۱ نهایی شد، سیستم صوت آماده است.»
                </p>
              </div>
            </div>
            {/* اعلان ۴: بازتاب رسمی رسانه ای */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer" data-action="openMediaModal('طومار تجدید بیعت در روزنامه عصر ایرانیان', 'روزنامه عصر ایرانیان')">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Icon name="newspaper" className="w-5 h-5"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">بازتاب رسمی در مطبوعات</span>
                  <span className="text-[9px] text-slate-400 font-mono">۱ ساعت پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  مطلب شما در شماره فردا <b>روزنامه عصر ایرانیان</b> و صفحه اصلی <b>عصر آنلاین</b> درج گردید[cite: 1].
                </p>
              </div>
            </div>
            {/* اعلان ۵: نظر یا منشن در کامنت‌ها */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Icon name="at-sign" className="w-5 h-5"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">دیدگاه و اشاره به شما</span>
                  <span className="text-[9px] text-slate-400 font-mono">۲ ساعت پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <b>علی حسینی (پایگاه ولیعصر):</b> «ما هم از امشب در میدان ولیعصر اجرای این ابتکار را شروع کردیم.»
                </p>
              </div>
            </div>
            {/* اعلان ۶: دنبال‌کننده جدید */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Icon name="user-plus" className="w-5 h-5"  />
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">دنبال‌کننده جدید</span>
                  <span className="text-[9px] text-slate-400 font-mono">۳ ساعت پیش</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <b>حجت‌الاسلام مهدی ماندگاری</b> پایگاه میدان شما را دنبال کرد.
                </p>
              </div>
            </div>
          </div>
        </section>
  );
}
