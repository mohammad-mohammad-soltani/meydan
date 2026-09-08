import { Icon } from "../icon";
export function ViewDirectChat() {
  return (
        <section id="view-direct-chat" className="app-view hidden bg-white dark:bg-[#070a0f] min-h-screen flex flex-col flex-1 relative">
          {/* لیست پیام‌ها */}
          <div id="directChatMessagesArea" className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 text-xs">
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl rounded-tr-none max-w-[82%] space-y-1">
                <p className="text-slate-800 dark:text-slate-200">سلام علیکم، سیستم صوتی میدان انقلاب وصل شد و آماده پخش صوت دم رأس ساعت ۲۱:۳۰ هستیم.</p>
                <span className="text-[9px] text-slate-400 block text-left font-mono">۲۰:۱۰</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-brand-red text-white p-3 rounded-2xl rounded-tl-none max-w-[82%] space-y-1">
                <p>خداقوت، فیش سخنرانی شب دوازدهم هم در صفحه محتوا بارگذاری شده است.</p>
                <span className="text-[9px] text-red-200 block text-left font-mono">۲۰:۱۵</span>
              </div>
            </div>
          </div>
          {/* منوی چندرسانه‌ای ارتفاع‌دار زیر هم */}
          <div id="chatMediaDropdown" className="absolute bottom-16 right-4 w-52 bg-white dark:bg-[#0e141f] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50 hidden transition-all duration-150">
            <div className="flex flex-col space-y-1 text-xs font-bold">
              <button data-action="attachChatMedia('تصویر');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><Icon name="image" className="w-4 h-4"  /></div>
                <span>ارسال عکس</span>
              </button>
              <button data-action="attachChatMedia('ویدیو');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
                <div className="w-8 h-8 rounded-full bg-red-500/10 text-brand-red flex items-center justify-center shrink-0"><Icon name="video" className="w-4 h-4"  /></div>
                <span>ارسال ویدیو</span>
              </button>
              <button data-action="attachChatMedia('صوت');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><Icon name="mic" className="w-4 h-4"  /></div>
                <span>ضبط و ارسال صوت</span>
              </button>
              <button data-action="attachChatMedia('موقعیت');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Icon name="map-pin" className="w-4 h-4"  /></div>
                <span>اشتراک موقعیت میدان</span>
              </button>
            </div>
          </div>
          {/* نوار ارسال پیام */}
          <div className="sticky bottom-0 w-full bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 z-30 flex items-center gap-2">
            <button type="button" data-action="toggleChatMediaMenu()" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-red flex items-center justify-center shrink-0 transition">
              <Icon name="plus" className="w-5 h-5"  />
            </button>
            <input type="text" id="directChatMessageInput" placeholder="پیام مستقیم خود را بنویسید..." className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red" />
            <button data-action="sendDirectChatMessage()" className="bg-brand-red hover:bg-red-700 text-white p-2.5 rounded-xl font-bold text-xs shrink-0 transition">
              <Icon name="send" className="w-4 h-4"  />
            </button>
          </div>
        </section>
  );
}
