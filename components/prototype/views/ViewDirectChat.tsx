import { Icon } from "../icon";

export function ViewDirectChat() {
  return (
    <section id="view-direct-chat" className="app-view direct-chat-view hidden bg-white dark:bg-[#070a0f] flex flex-col flex-1 relative">
      <header className="direct-chat-header shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" aria-label="بازگشت به گفتگوها" data-action="switchView('view-chat')" className="direct-chat-icon-button text-slate-500 hover:text-brand-red shrink-0">
            <Icon name="arrow-right" className="w-5 h-5" />
          </button>
          <div id="directChatAvatar" aria-hidden="true" className="direct-chat-avatar">
            م.ا
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 id="directChatTitle" className="font-black text-sm text-slate-900 dark:text-white truncate">پایگاه میدان انقلاب</h3>
              <span className="direct-chat-status-dot" aria-label="آنلاین" />
            </div>
            <span id="directChatHandle" className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">@tehran_enghelab · آنلاین</span>
          </div>
        </div>
        <button type="button" aria-label="تماس صوتی" data-action="alert('اتصال صوتی برقرار نشد.')" className="direct-chat-icon-button text-slate-500 hover:text-brand-red shrink-0">
          <Icon name="phone" className="w-4.5 h-4.5" />
        </button>
      </header>

      <div id="directChatMessagesArea" className="direct-chat-messages flex-1 overflow-y-auto no-scrollbar px-4 py-5 space-y-4 text-xs">
        <div className="direct-chat-day-label"><span>امروز</span></div>

        <div className="flex justify-start">
          <div className="direct-chat-bubble direct-chat-bubble-incoming space-y-1.5">
            <p>سلام علیکم، سیستم صوتی میدان انقلاب وصل شد و آماده پخش صوت دم رأس ساعت ۲۱:۳۰ هستیم.</p>
            <span className="direct-chat-time">۲۰:۱۰</span>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="direct-chat-bubble direct-chat-bubble-outgoing space-y-1.5">
            <p>خداقوت، فیش سخنرانی شب دوازدهم هم در صفحه محتوا بارگذاری شده است.</p>
            <span className="direct-chat-time">۲۰:۱۵</span>
          </div>
        </div>
      </div>

      <div id="chatMediaDropdown" className="direct-chat-media-menu absolute bottom-20 right-4 w-52 bg-white dark:bg-[#0e141f] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50 hidden">
        <div className="flex flex-col space-y-1 text-xs font-bold">
          <button data-action="attachChatMedia('تصویر');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><Icon name="image" className="w-4 h-4" /></div>
            <span>ارسال عکس</span>
          </button>
          <button data-action="attachChatMedia('ویدیو');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-brand-red flex items-center justify-center shrink-0"><Icon name="video" className="w-4 h-4" /></div>
            <span>ارسال ویدیو</span>
          </button>
          <button data-action="attachChatMedia('صوت');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><Icon name="mic" className="w-4 h-4" /></div>
            <span>ضبط و ارسال صوت</span>
          </button>
          <button data-action="attachChatMedia('موقعیت');" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Icon name="map-pin" className="w-4 h-4" /></div>
            <span>اشتراک موقعیت میدان</span>
          </button>
        </div>
      </div>

      <footer className="direct-chat-composer shrink-0 border-t border-slate-200 dark:border-slate-800 px-3 pt-2.5 z-30">
        <div className="direct-chat-input-shell flex items-center gap-2">
          <button type="button" aria-label="افزودن فایل" data-action="toggleChatMediaMenu()" className="direct-chat-attach-button shrink-0">
            <Icon name="plus" className="w-5 h-5" />
          </button>
          <input type="text" id="directChatMessageInput" placeholder="پیام بنویسید..." className="flex-1 min-w-0 bg-transparent border-0 px-1 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
          <button type="button" aria-label="ارسال پیام" data-action="sendDirectChatMessage()" className="direct-chat-send-button shrink-0">
            <Icon name="send" className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </section>
  );
}
