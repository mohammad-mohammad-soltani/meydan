import type * as Leaflet from "leaflet";
import { LIVE_MAP_THEME } from "../map-theme";

type MapLibreGlobal = {
  setRTLTextPlugin: (url: string) => void;
  getRTLTextPluginStatus?: () => string;
};

type MapLibreLeafletLayer = Leaflet.Layer;

type LeafletWithMapLibre = typeof import("leaflet") & {
  maplibreGL?: (options: {
    style: string | Record<string, unknown>;
    interactive?: boolean;
    attributionControl?: boolean;
  }) => MapLibreLeafletLayer;
};

type MapWindow = Window & {
  L?: LeafletWithMapLibre;
  maplibregl?: MapLibreGlobal;
};

/**
 * The OpenFreeMap dark style ships English-first names ("TURKMENISTAN"), so the
 * style is rewritten before the map is created to render Persian only.
 *
 * Which property holds the Persian text differs by layer, and picking the wrong
 * one silently drops most labels. Iranian streets carry the Persian name in
 * `name:nonlatin` (1106 of 1113 features in a Tehran tile) while `name:fa` is
 * present on only 13 of them; place and water features do have `name:fa`.
 */
const PLACE_LABEL_LAYER_IDS = new Set([
  "place_country_major",
  "place_country_minor",
  "place_state",
  "place_city_large",
  "place_city",
  "place_town",
  "place_village",
  "place_suburb",
  "place_other",
]);

/** Street and water labels, which are legible and wanted at close zoom. */
const ROAD_LABEL_LAYER_IDS = new Set(["highway_name_other", "highway_name_motorway"]);
const WATER_LABEL_LAYER_IDS = new Set(["water_name"]);

/**
 * Symbol layers that stay hidden: one-way arrows are drawn by the style as
 * icons and add noise over the province boundaries.
 */
const HIDDEN_SYMBOL_LAYER_IDS = new Set(["road_oneway", "road_oneway_opposite"]);

/**
 * Place and water features carry `name:fa`, so requiring it both guarantees
 * Persian and drops features whose name only exists in another language.
 */
const PLACE_TEXT_FIELDS = ["get", "name:fa"];
const HAS_PLACE_TEXT = ["has", "name:fa"];

/**
 * Streets are the exception. Iranian street names are stored in `name:nonlatin`
 * (1106 of 1113 features in a Tehran tile) and only 13 also have `name:fa`, so
 * requiring `name:fa` would drop nearly every street. The value is Persian for
 * Iranian roads; falling back no further than `name:nonlatin` keeps latin names
 * off the map.
 */
const ROAD_TEXT_FIELDS = ["coalesce", ["get", "name:fa"], ["get", "name:nonlatin"]];
const HAS_ROAD_TEXT = ["any", ["has", "name:fa"], ["has", "name:nonlatin"]];

type StyleLayer = {
  id: string;
  type?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  filter?: unknown;
};

function ensureStylesheet() {
  if (document.getElementById("meydan-maplibre-css")) return;

  const link = document.createElement("link");
  link.id = "meydan-maplibre-css";
  link.rel = "stylesheet";
  link.href = LIVE_MAP_THEME.mapLibreCssUrl;
  document.head.appendChild(link);
}

function loadScriptOnce(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");

    const handleLoad = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    const handleError = () => reject(new Error(`Unable to load ${src}`));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.id = id;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * Arabic script needs the RTL shaping plugin, otherwise Persian labels render as
 * disconnected, reversed letterforms. It must be registered before the style
 * loads, and MapLibre only allows registering once per page.
 */
function registerRtlTextPlugin(mapLibre: MapLibreGlobal) {
  const status = mapLibre.getRTLTextPluginStatus?.() ?? "unavailable";
  if (status !== "unavailable") return;
  mapLibre.setRTLTextPlugin(LIVE_MAP_THEME.rtlTextPluginUrl);
}

/**
 * Fetches the remote style and rewrites it for this app before MapLibre parses
 * it. Doing it here rather than with post-load layer edits matters: glyph ranges
 * are requested while the first tiles are parsed, so filters applied after the
 * `load` event arrive too late and the initial render still pulls Noto Sans.
 *
 * The rewrite serves glyphs from the self-hosted IRANSansXV ranges, points every
 * label at that font, and keeps place, street and water names in Persian by
 * rewriting `text-field` and narrowing each layer's filter to features that have
 * a Persian name. Layers without Persian text and the one-way arrow icons are
 * hidden.
 */
async function loadLocalizedStyle(): Promise<string | Record<string, unknown>> {
  try {
    const response = await fetch(LIVE_MAP_THEME.styleUrl, { cache: "force-cache" });
    if (!response.ok) return LIVE_MAP_THEME.styleUrl;

    const style = (await response.json()) as { glyphs?: string; layers?: StyleLayer[] };

    return {
      ...style,
      glyphs: LIVE_MAP_THEME.glyphsUrl,
      layers: (style.layers ?? []).map((layer): StyleLayer => {
        if (layer.type !== "symbol") return layer;

        const layout = { ...layer.layout, "text-font": [...LIVE_MAP_THEME.labelFontStack] };

        if (HIDDEN_SYMBOL_LAYER_IDS.has(layer.id)) {
          return { ...layer, layout: { ...layout, visibility: "none" } };
        }

        const isPlaceLabel = PLACE_LABEL_LAYER_IDS.has(layer.id);
        const isRoadLabel = ROAD_LABEL_LAYER_IDS.has(layer.id);
        const isWaterLabel = WATER_LABEL_LAYER_IDS.has(layer.id);

        if (!isPlaceLabel && !isRoadLabel && !isWaterLabel) {
          return { ...layer, layout: { ...layout, visibility: "none" } };
        }

        const textField = isRoadLabel ? ROAD_TEXT_FIELDS : PLACE_TEXT_FIELDS;
        const textFilter = isRoadLabel ? HAS_ROAD_TEXT : HAS_PLACE_TEXT;

        return {
          ...layer,
          layout: {
            ...layout,
            "text-field": textField,
            // Uppercasing does nothing useful for Persian and fights the
            // shaping plugin.
            ...("text-transform" in layout ? { "text-transform": "none" } : {}),
            // The style's label colors are near-black for a light basemap and
            // would be invisible here.
            ...(isRoadLabel ? { "text-size": 11 } : {}),
          },
          paint: {
            ...(layer.paint ?? {}),
            "text-color": isPlaceLabel
              ? LIVE_MAP_THEME.placeLabel
              : isRoadLabel
                ? LIVE_MAP_THEME.roadLabel
                : LIVE_MAP_THEME.waterLabel,
            "text-halo-color": LIVE_MAP_THEME.labelHalo,
            "text-halo-width": 1.2,
            "text-halo-blur": 0.4,
          },
          filter: layer.filter ? ["all", layer.filter, textFilter] : textFilter,
        };
      }),
    };
  } catch {
    return LIVE_MAP_THEME.styleUrl;
  }
}

/**
 * The bridge assigns L.MaplibreGL onto its `L` argument, so it must receive a
 * mutable object: Leaflet's ESM namespace is non-extensible and would discard
 * the assignment silently.
 *
 * The object identity matters more than it looks. The bridge script only runs
 * once per page, so it augments exactly one object. Replacing `window.L` with a
 * fresh spread on a later mount — returning to /map by client-side navigation —
 * would hand MapLibre a copy with no `maplibreGL`, which is why the basemap only
 * worked after a full reload. Reusing the existing object unconditionally also
 * covers a remount that races ahead of the still-loading bridge script.
 */
function ensureLeafletGlobal(leaflet: typeof import("leaflet")): LeafletWithMapLibre {
  const browserWindow = window as MapWindow;
  if (browserWindow.L) return browserWindow.L;

  const created = { ...(leaflet as LeafletWithMapLibre) };
  browserWindow.L = created;
  return created;
}

export async function addOpenFreeMapBasemap(
  leaflet: typeof import("leaflet"),
  map: Leaflet.Map,
): Promise<Leaflet.Layer> {
  ensureStylesheet();

  const browserWindow = window as MapWindow;
  ensureLeafletGlobal(leaflet);

  await loadScriptOnce("meydan-maplibre-gl", LIVE_MAP_THEME.mapLibreScriptUrl);
  if (browserWindow.maplibregl) registerRtlTextPlugin(browserWindow.maplibregl);
  await loadScriptOnce(
    "meydan-maplibre-leaflet",
    LIVE_MAP_THEME.leafletBridgeScriptUrl,
  );

  const bridge = browserWindow.L?.maplibreGL;
  if (!bridge || !browserWindow.maplibregl) {
    throw new Error("MapLibre Leaflet bridge is unavailable");
  }

  const style = await loadLocalizedStyle();
  const layer = bridge({
    style,
    interactive: false,
    attributionControl: false,
  }).addTo(map) as MapLibreLeafletLayer;

  return layer;
}
