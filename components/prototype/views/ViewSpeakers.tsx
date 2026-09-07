import { Icon } from "../icon";
export function ViewSpeakers() {
  return (
        <section id="view-speakers" className="app-view hidden p-4 space-y-3 pb-24">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button data-action="switchView('view-content')" className="text-slate-500 hover:text-brand-red">
                <Icon name="arrow-right" className="w-5 h-5"  />
              </button>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">فهرست خطبا و سخنرانان جهاد تبیین</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">جستجو، بررسی سوابق و ثبت درخواست اعزام به میدان</p>
              </div>
            </div>
            <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded font-bold">۳۴ استاد آماده</span>
          </div>
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-slate-400 absolute right-3 top-3"  />
            <input type="text" id="speakerSearchInput" data-input-action="filterSpeakersList(this.value)" placeholder="جستجوی نام استاد، موضوع سخنرانی یا شهر..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red" />
          </div>
          <div id="speakerRequestPanel" className="hidden border border-brand-red/40 bg-red-500/5 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-red" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">درخواست اعزام: <span id="selectedSpeakerName" className="text-brand-red" /></span>
              </div>
              <button data-action="closeSpeakerRequestPanel()" className="text-slate-400 hover:text-white"><Icon name="x" className="w-4 h-4"  /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">پایگاه متقاضی:</label>
                <input type="text" defaultValue="میدان انقلاب تهران" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">زمان منبر:</label>
                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold">
                  <option>امشب - ساعت ۲۱:۰۰</option>
                  <option>فردا شب - ساعت ۲۱:۰۰</option>
                </select>
              </div>
            </div>
            <button data-action="submitSpeakerBooking()" className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition">
              ثبت و ارسال رسمی دعوت‌نامه به استاد
            </button>
          </div>
          <div id="speakersListContainer" className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <div className="speaker-card py-3 flex items-start justify-between gap-2.5">
              <div className="flex gap-2.5 items-start">
                <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">ح.م</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">حجت‌الاسلام مهدی ماندگاری</span>
                    <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                  </div>
                  <div className="text-[11px] text-slate-400">@mandegari_live · قم / تهران</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">تخصص: انگیزش ایمانی، سیره شهدا و امیدآفرینی در میدان.</p>
                </div>
              </div>
              <button data-action="openSpeakerBooking('حجت‌الاسلام مهدی ماندگاری')" className="bg-slate-900 hover:bg-brand-red text-white dark:bg-white dark:text-slate-900 dark:hover:bg-brand-red dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition">
                درخواست منبر
              </button>
            </div>
            <div className="speaker-card py-3 flex items-start justify-between gap-2.5">
              <div className="flex gap-2.5 items-start">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">د.س</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">دکتر سید بشیر حسینی</span>
                    <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                  </div>
                  <div className="text-[11px] text-slate-400">@dr_bashirhosseini · تهران</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">تخصص: سواد رسانه‌ای، پدافند شناختی و گفتگوی چهره‌به‌چهره با جوانان.</p>
                </div>
              </div>
              <button data-action="openSpeakerBooking('دکتر سید بشیر حسینی')" className="bg-slate-900 hover:bg-brand-red text-white dark:bg-white dark:text-slate-900 dark:hover:bg-brand-red dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition">
                درخواست منبر
              </button>
            </div>
            <div className="speaker-card py-3 flex items-start justify-between gap-2.5">
              <div className="flex gap-2.5 items-start">
                <div className="w-11 h-11 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0">ع.پ</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">حجت‌الاسلام علیرضا پناهیان</span>
                    <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                  </div>
                  <div className="text-[11px] text-slate-400">@panahian_ir · تهران</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">تخصص: سازمان‌دهی اجتماعی، نبرد تمدنی و شرح مبانی مقاومت.</p>
                </div>
              </div>
              <button data-action="openSpeakerBooking('حجت‌الاسلام علیرضا پناهیان')" className="bg-slate-900 hover:bg-brand-red text-white dark:bg-white dark:text-slate-900 dark:hover:bg-brand-red dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition">
                درخواست منبر
              </button>
            </div>
            <div className="speaker-card py-3 flex items-start justify-between gap-2.5">
              <div className="flex gap-2.5 items-start">
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">ن.ر</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">استاد ناصر رفیعی</span>
                    <Icon name="badge-check" className="w-3.5 h-3.5 text-blue-500 fill-blue-500"  />
                  </div>
                  <div className="text-[11px] text-slate-400">@rafiei_ir · قم</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">تخصص: تاریخ اسلام، مواجهه اهل‌بیت با محاصره و خطبه‌های تبیین‌گر.</p>
                </div>
              </div>
              <button data-action="openSpeakerBooking('استاد ناصر رفیعی')" className="bg-slate-900 hover:bg-brand-red text-white dark:bg-white dark:text-slate-900 dark:hover:bg-brand-red dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition">
                درخواست منبر
              </button>
            </div>
          </div>
        </section>
  );
}
