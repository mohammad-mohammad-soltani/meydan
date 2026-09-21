export const LIVE_MAP_THEME = {
  styleUrl: "https://tiles.openfreemap.org/styles/dark",
  mapLibreScriptUrl:
    "https://unpkg.com/maplibre-gl@5.14.0/dist/maplibre-gl.js",
  mapLibreCssUrl:
    "https://unpkg.com/maplibre-gl@5.14.0/dist/maplibre-gl.css",
  leafletBridgeScriptUrl:
    "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.3/leaflet-maplibre-gl.js",
  rtlTextPluginUrl:
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
  /** Self-hosted SDF ranges generated from app/fonts/IRANSansXV.woff2. */
  glyphsUrl: "/fonts/{fontstack}/{range}.pbf",
  provincesGeoJsonUrl:
    "https://cdn.jsdelivr.net/gh/hosseinhabibi2004/iran-geojson@master/data/provinces/provinces.min.geojson",
  attribution: "OpenFreeMap © OpenMapTiles · Data © OpenStreetMap",
  /**
   * Map labels render from SDF glyph ranges, not the app's woff2, so IRANSansXV
   * is self-hosted under public/fonts/IRANSansXV as generated {range}.pbf files.
   * The name must match the glyphsUrl {fontstack} directory.
   */
  labelFontStack: ["IRANSansXV"],
  background: "#171a1b",
  provinceStroke: "#e5483f",
  provinceFill: "#272a2b",
  pin: "#e5544b",
  /**
   * Label colors are set here because the upstream style targets a light
   * basemap; its near-black text would be invisible on this dark background.
   */
  placeLabel: "#d8d4cf",
  roadLabel: "#a8a29c",
  waterLabel: "#8fb6c9",
  labelHalo: "rgba(16,18,19,.85)",
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
    <div class="map-live-pin" style="width:44px;height:44px;box-sizing:border-box;border:3px solid #fff;border-radius:50%;background:#e5544b;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.45);cursor:pointer">
      <span style="color:#fff;font-size:14px;font-weight:900;line-height:1">${count}</span>
    </div>
  `;
}
