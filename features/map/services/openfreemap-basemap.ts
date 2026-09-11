import type * as Leaflet from "leaflet";
import { LIVE_MAP_THEME } from "../map-theme";

type MapLibreStyleLayer = {
  id: string;
  type?: string;
};

type MapLibreMap = {
  getStyle: () => { layers?: MapLibreStyleLayer[] };
  isStyleLoaded: () => boolean;
  once: (event: string, handler: () => void) => void;
  setLayoutProperty: (layerId: string, name: string, value: string) => void;
};

type MapLibreLeafletLayer = Leaflet.Layer & {
  getMaplibreMap: () => MapLibreMap;
};

type LeafletWithMapLibre = typeof import("leaflet") & {
  maplibreGL?: (options: {
    style: string;
    interactive?: boolean;
    attributionControl?: boolean;
  }) => MapLibreLeafletLayer;
};

type MapWindow = Window & {
  L?: LeafletWithMapLibre;
  maplibregl?: unknown;
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

function hideBaseMapLabels(map: MapLibreMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== "symbol") continue;
    map.setLayoutProperty(layer.id, "visibility", "none");
  }
}

export async function addOpenFreeMapBasemap(
  leaflet: typeof import("leaflet"),
  map: Leaflet.Map,
): Promise<Leaflet.Layer> {
  ensureStylesheet();

  const browserWindow = window as MapWindow;
  browserWindow.L = leaflet as LeafletWithMapLibre;

  await loadScriptOnce("meydan-maplibre-gl", LIVE_MAP_THEME.mapLibreScriptUrl);
  await loadScriptOnce(
    "meydan-maplibre-leaflet",
    LIVE_MAP_THEME.leafletBridgeScriptUrl,
  );

  const bridge = browserWindow.L?.maplibreGL;
  if (!bridge || !browserWindow.maplibregl) {
    throw new Error("MapLibre Leaflet bridge is unavailable");
  }

  const layer = bridge({
    style: LIVE_MAP_THEME.styleUrl,
    interactive: false,
    attributionControl: false,
  }).addTo(map) as MapLibreLeafletLayer;

  const mapLibreMap = layer.getMaplibreMap();
  if (mapLibreMap.isStyleLoaded()) {
    hideBaseMapLabels(mapLibreMap);
  } else {
    mapLibreMap.once("load", () => hideBaseMapLabels(mapLibreMap));
  }

  return layer;
}
