import { Icon } from "../icon";
import iranCitiesData from "../../../data/iran-cities.json";

const defaultProvinceId = 8;
const defaultCities = iranCitiesData.shahr.filter((city) => city.ostan === defaultProvinceId);
const defaultCity = defaultCities.find((city) => city.name === "تهران") ?? defaultCities[0];

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
                <select id="mapProvinceSelect" defaultValue={defaultProvinceId} data-change-action="selectProvinceFromDropdown(this.value)" tabIndex={-1} aria-hidden="true" className="sr-only">
                  {iranCitiesData.ostan.map((province) => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </select>
                <div className="map-custom-select" data-map-select="province">
                  <button type="button" id="mapProvinceTrigger" data-action="toggleProvinceDropdown()" aria-haspopup="listbox" aria-expanded="false" className="map-custom-select-trigger flex w-full min-h-10 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-right text-xs font-bold text-slate-800 shadow-sm transition hover:border-brand-red focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <span id="mapProvinceLabel" className="truncate">تهران</span>
                    <Icon name="chevron-down" className="w-4 h-4 shrink-0" />
                  </button>
                  <div id="mapProvinceMenu" className="map-custom-select-menu hidden" role="listbox" aria-label="استان‌ها">
                    <div className="map-custom-select-search">
                      <Icon name="search" className="w-4 h-4 shrink-0" />
                      <input id="mapProvinceSearch" type="search" placeholder="جست‌وجوی استان..." data-input-action="filterProvinceOptions" aria-label="جست‌وجوی استان" />
                    </div>
                    <div id="mapProvinceOptions" className="map-custom-select-options">
                      {iranCitiesData.ostan.map((province) => (
                        <button type="button" key={province.id} value={province.id} data-province-id={province.id} data-action={`chooseProvince(this.value)`} className={province.id === defaultProvinceId ? "map-custom-select-option is-selected" : "map-custom-select-option"} role="option" aria-selected={province.id === defaultProvinceId}>
                          <span>{province.name}</span>
                          <Icon name="check" className="map-custom-select-check w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-[10px] mb-1">شهر / میدان:</label>
                <select id="mapCitySelect" defaultValue={defaultCity?.id} data-change-action="filterSquaresByCity(this.value)" tabIndex={-1} aria-hidden="true" className="sr-only">
                  {defaultCities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <div className="map-custom-select" data-map-select="city">
                  <button type="button" id="mapCityTrigger" data-action="toggleCityDropdown()" aria-haspopup="listbox" aria-expanded="false" className="map-custom-select-trigger map-custom-select-trigger-city">
                    <span className="map-custom-select-trigger-icon"><Icon name="map-pin" className="w-3.5 h-3.5" /></span>
                    <span id="mapCityLabel" className="truncate flex-1">تهران</span>
                    <Icon name="chevron-down" className="map-custom-select-chevron w-4 h-4 shrink-0" />
                  </button>
                  <div id="mapCityMenu" className="map-custom-select-menu hidden" role="listbox" aria-label="شهرها">
                    <div className="map-custom-select-search">
                      <Icon name="search" className="w-4 h-4 shrink-0" />
                      <input id="mapCitySearch" type="search" placeholder="جست‌وجوی شهر..." data-input-action="filterCityOptions" aria-label="جست‌وجوی شهر" />
                    </div>
                    <div id="mapCityOptions" className="map-custom-select-options">
                      {defaultCities.map((city) => (
                        <button type="button" key={city.id} value={city.id} data-city-id={city.id} data-action={`chooseCity(this.value)`} className={city.id === defaultCity?.id ? "map-custom-select-option is-selected" : "map-custom-select-option"} role="option" aria-selected={city.id === defaultCity?.id}>
                          <span>{city.name}</span>
                          <Icon name="check" className="map-custom-select-check w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-80 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
            <iframe id="liveMapFrame" title="نقشه زنده میادین ایران" className="block w-full h-full border-0" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=44.0%2C25.0%2C63.5%2C40.5&layer=mapnik&marker=35.7%2C51.4" />
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
