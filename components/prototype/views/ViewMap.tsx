import { Icon } from "../icon";
export function ViewMap() {
  return (
        <section id="view-map" className="app-view hidden p-4 space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="filter" className="w-4 h-4 text-brand-red"  /> انتخاب استان و میدان:
              </span>
              <span className="text-[10px] bg-red-500/10 text-brand-red border border-red-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" /> لایو تجمعات فعال
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-[10px] mb-1">استان:</label>
                <select id="mapProvinceSelect" data-change-action="selectProvinceFromDropdown(this.value)" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red">
                  <option value="tehran">تهران</option>
                  <option value="khorasan-razavi">خراسان رضوی</option>
                  <option value="isfahan">اصفهان</option>
                  <option value="fars">فارس</option>
                  <option value="qom">قم</option>
                  <option value="khuzestan">خوزستان</option>
                  <option value="azerbaijan-east">آذربایجان شرقی</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-[10px] mb-1">شهر / میدان:</label>
                <select id="mapCitySelect" data-change-action="filterSquaresByCity(this.value)" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-red">
                  <option value="tehran">تهران</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-col items-center">
            <div className="w-full flex justify-center items-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 p-1">
              <iframe id="liveMapFrame" title="نقشه زنده میادین ایران" className="w-full h-72 max-h-80 rounded-lg border-0" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=44.0%2C25.0%2C63.5%2C40.5&layer=mapnik&marker=35.7%2C51.4" />
              <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer" className="mt-2 text-[10px] text-blue-500 hover:underline">نمایش نقشه در OpenStreetMap</a>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="map-pin" className="w-4 h-4 text-brand-red"  />
                میادین فعال استان <span id="currentProvinceName" className="text-brand-red font-black">تهران</span>:
              </h3>
              <span id="provinceTotalCount" className="text-[10px] text-slate-500 dark:text-slate-400">۱۴ میدان فعال</span>
            </div>
            <div id="squaresListContainer" className="space-y-2" />
          </div>
        </section>
  );
}
