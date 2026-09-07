import { Icon } from "../icon";
export function ViewAllPodcasts() {
  return (
        <section id="view-all-podcasts" className="app-view hidden p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button data-action="switchView('view-content')" className="text-slate-500 hover:text-brand-red">
                <Icon name="arrow-right" className="w-5 h-5"  />
              </button>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">گنجینه صوتی میادین و منابر</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">فهرست صوت‌ها و هم‌نوایی‌ها</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold">۲۴ قطعه فعال</span>
          </div>
          <div className="space-y-3 pt-1">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded font-bold">دم محوری</span>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white mt-1">«فرمانده کل قوا»</h3>
                  <p className="text-[11px] text-slate-500">حاج میثم مطیعی · ۳ دقیقه</p>
                </div>
                <button data-action="playAudio('فرمانده کل قوا')" className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center">
                  <Icon name="play" className="w-4 h-4 fill-white mr-0.5"  />
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>محل بیان: <b>میدان انقلاب تهران - شب دوازدهم</b></span>
                <button data-action="openAudioModal('دم هماهنگ: فرمانده کل قوا', 'حاج میثم مطیعی', 'میدان انقلاب تهران - شب دوازدهم', 'هم‌نوایی رأس ساعت ۲۱:۳۰.')" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">صفحه صوت و متن</button>
              </div>
            </div>
          </div>
        </section>
  );
}
