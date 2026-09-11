export const LIVE_MAP_THEME = {
  tileUrl: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
  provincesGeoJsonUrl:
    "https://cdn.jsdelivr.net/gh/hosseinhabibi2004/iran-geojson@master/data/provinces/provinces.min.geojson",
  background: "#171a1b",
  provinceStroke: "#e5483f",
  provinceFill: "#272a2b",
  pin: "#e5544b",
} as const;

export function makeProvinceStyle() {
  return {
    color: LIVE_MAP_THEME.provinceStroke,
    weight: 1.35,
    opacity: 0.95,
    fillColor: LIVE_MAP_THEME.provinceFill,
    fillOpacity: 0.34,
  };
}

export function makePinHtml(count: string): string {
  return `
    <div class="map-live-pin" style="position:relative;width:36px;height:44px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.38));cursor:pointer">
      <div style="position:absolute;left:4px;top:2px;width:28px;height:28px;border-radius:50% 50% 50% 0;background:#e5544b;transform:rotate(45deg)"></div>
      <span style="position:absolute;inset:0 0 auto 0;height:32px;display:grid;place-items:center;color:#171717;font-size:13px;font-weight:900;line-height:1">${count}</span>
    </div>
  `;
}
