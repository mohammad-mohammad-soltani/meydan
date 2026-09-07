import { Icon } from "../icon";
export function ViewFullCompose() {
  return (
        <section id="view-full-compose" className="app-view hidden p-4 space-y-4 bg-white dark:bg-[#070a0f] min-h-screen">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button data-action="switchView('view-feed')" className="text-slate-500 hover:text-brand-red">
                <Icon name="arrow-right" className="w-5 h-5"  />
              </button>
              <span className="font-bold text-sm text-slate-900 dark:text-white">ثبت روایت یا ایده جدید</span>
            </div>
            <button data-action="submitNewTweet()" className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs px-4 py-1.5 rounded-full transition">
              انتشار به نام میدان
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" data-action="setPostType('روایت میدانی', this)" className="post-type-btn bg-brand-red text-white text-xs px-3.5 py-1.5 rounded-xl font-bold">روایت میدانی</button>
            <button type="button" data-action="setPostType('پژواک کار خوب', this)" className="post-type-btn bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs px-3.5 py-1.5 rounded-xl font-bold">پژواک (ایده و کار خوب)</button>
          </div>
          <div className="space-y-3 pt-2">
            <input type="text" id="fullComposeTitle" placeholder="تیتر یا موضوع اصلی روایت..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-red font-bold" />
            <textarea id="fullComposeTextarea" data-input-action="autoExpandTextarea(this)" placeholder="شرح ماجرا، حال‌وهوای امشب میدان، نیازها یا دستاوردها..." rows={5} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-red resize-none overflow-hidden transition-all duration-75" defaultValue={""} />
          </div>
          <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">پیوست‌های چندرسانه‌ای:</span>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
              <button className="flex items-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:text-brand-red"><Icon name="image" className="w-4 h-4"  /> عکس</button>
              <button className="flex items-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:text-brand-red"><Icon name="video" className="w-4 h-4"  /> ویدیو</button>
              <button className="flex items-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:text-brand-red"><Icon name="map-pin" className="w-4 h-4"  /> مکان میدان</button>
              <button className="flex items-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:text-brand-red"><Icon name="mic" className="w-4 h-4"  /> صوت</button>
            </div>
          </div>
        </section>
  );
}
