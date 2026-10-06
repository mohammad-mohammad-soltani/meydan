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
  /** Versioned local copy; province grouping must work without a CDN. */
  provincesGeoJsonUrl: "/maps/iran-provinces.geojson",
  attribution: "OpenFreeMap © OpenMapTiles · Data © OpenStreetMap",
  /**
   * Map labels render from SDF glyph ranges, not the app's woff2, so IRANSansXV
   * is self-hosted under public/fonts/IRANSansXV as generated {range}.pbf files.
   * The name must match the glyphsUrl {fontstack} directory.
   */
  labelFontStack: ["IRANSansXV"],
  background: "#1c1c1c",
  provinceStroke: "#9a9aa3",
  provinceFill: "#242424",
  pin: "#e4152e",
  /**
   * Label colors are set here because the upstream style targets a light
   * basemap; its near-black text would be invisible on this dark background.
   */
  placeLabel: "#f1f1f3",
  roadLabel: "#9a9aa3",
  waterLabel: "#9a9aa3",
  labelHalo: "rgba(28,28,28,.85)",
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

/** A province polygon the viewer has chosen: accent outline and a soft accent wash. */
export function makeSelectedProvinceStyle() {
  return {
    color: LIVE_MAP_THEME.pin,
    weight: 2.4,
    opacity: 1,
    fillColor: LIVE_MAP_THEME.pin,
    fillOpacity: 0.16,
  };
}

/** Under the pointer: the outline firms up and the wash lightens a little. */
export function makeHoverProvinceStyle() {
  return { weight: 2, fillOpacity: 0.5, color: LIVE_MAP_THEME.pin, opacity: 0.9 };
}

export function makePinHtml(count: string): string {
  return `
    <div class="group relative flex cursor-pointer items-center justify-center">
      
      <div
        class="
          absolute
          h-11 w-11
          rounded-full
          bg-red-500/20
          transition-all duration-300
          group-hover:scale-110
          group-hover:bg-red-500/25
        "
      ></div>

      <div
        class="
          map-live-pin
          relative z-10
          flex h-9 min-w-9 items-center justify-center
          rounded-full
          border-[3px] border-white
          bg-gradient-to-br from-red-400 to-red-600
          px-1.5
          shadow-[0_5px_16px_rgba(0,0,0,0.35)]
          transition-all duration-200 ease-out
          group-hover:-translate-y-0.5
          group-hover:scale-110
          group-hover:shadow-[0_8px_22px_rgba(0,0,0,0.4)]
          group-active:scale-95
        "
      >
        <span
          class="
            select-none
            text-[13px]
            font-black
            leading-none
            tracking-tight
            text-white
            drop-shadow-sm
          "
        >
          ${count}
        </span>
      </div>

    </div>
  `;
}
