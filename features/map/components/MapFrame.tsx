"use client";

import { IRAN_ISLANDS } from "../data/iran-islands";
import {
  LoaderCircle,
  LocateFixed,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SquareMarker } from "../services/map.service";
import type { CountAggregate, MapLevel, MapViewport } from "../hooks/useMap";
import { addOpenFreeMapBasemap } from "../services/openfreemap-basemap";
import { squareAvatar, squarePopup } from "./marker-content";
import { normalizePlace } from "../geo/aggregation";
import "./live-map.css";
import { LIVE_MAP_THEME, makePinHtml, makeProvinceStyle } from "../map-theme";

const iranCenter: [number, number] = [32.4279, 53.688];
const initialZoom = 5;

type ScaleState = {
  distanceKm: number;
  width: number;
};

function nextScale(map: import("leaflet").Map): ScaleState {
  const latitude = map.getCenter().lat;
  const zoom = map.getZoom();
  const metersPerPixel =
    (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
  const maxMeters = metersPerPixel * 132;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(maxMeters, 1)));
  const normalized = maxMeters / magnitude;
  const multiplier = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  const distanceMeters = multiplier * magnitude;

  return {
    distanceKm: distanceMeters / 1000,
    width: Math.max(54, Math.min(132, distanceMeters / metersPerPixel)),
  };
}

function formatScale(value: number): string {
  if (value >= 1)
    return value.toLocaleString("fa-IR", { maximumFractionDigits: 0 });
  return (value * 1000).toLocaleString("fa-IR", { maximumFractionDigits: 0 });
}

export function MapFrame({
  squares,
  aggregates,
  center,
  searchProvinces,
  searchCities,
  searchSquares,
  level,
  onSelectAggregate,
  onViewportLevel,
}: {
  squares: SquareMarker[];
  aggregates: CountAggregate[];
  searchProvinces: CountAggregate[];
  searchCities: CountAggregate[];
  searchSquares: SquareMarker[];
  center: { latitude: number; longitude: number; zoom?: number } | null;
  level: MapLevel;
  onSelectAggregate: (id: string) => void;
  onViewportLevel: (viewport: MapViewport) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef(
    new Map<string, { marker: import("leaflet").Marker; signature: string }>(),
  );
  const syncViewportRef = useRef<(() => void) | null>(null);
  const provincesVisibleRef = useRef(true);
  const provinceLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const userLocationRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onSelectAggregateRef = useRef(onSelectAggregate);
  const onViewportLevelRef = useRef(onViewportLevel);
  const [ready, setReady] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [scale, setScale] = useState<ScaleState>({
    distanceKm: 500,
    width: 120,
  });

  useEffect(() => {
    onSelectAggregateRef.current = onSelectAggregate;
  }, [onSelectAggregate]);

  useEffect(() => {
    onViewportLevelRef.current = onViewportLevel;
    syncViewportRef.current?.();
  }, [onViewportLevel]);

  const searchResults = useMemo(() => {
    const normalized = normalizePlace(query);
    if (!normalized) return [];
    return [
      ...searchProvinces.map((item) => ({
        ...item,
        key: `province:${item.id}`,
        label: "استان",
        zoom: 7,
      })),
      ...searchCities.map((item) => ({
        ...item,
        key: `city:${item.id}`,
        label: "شهر",
        zoom: 10,
      })),
      ...searchSquares.map((item) => ({
        ...item,
        key: `square:${item.id}`,
        label: "میدان",
        zoom: 15,
      })),
      ...IRAN_ISLANDS.map((island) => ({
        id: island.name,
        name: `جزیرهٔ ${island.name}`,
        latitude: island.latitude,
        longitude: island.longitude,
        key: `island:${island.name}`,
        label: `جزیره · ${island.province}`,
        zoom: 11,
      })),
    ]
      .filter((item) => normalizePlace(item.name).includes(normalized))
      .slice(0, 8);
  }, [searchProvinces, searchCities, searchSquares, query]);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    let resizeObserver: ResizeObserver | undefined;
    let resizeFrame = 0;
    const markerEntries = markersRef.current;

    void import("leaflet").then(async (L) => {
      if (disposed || !element.current) return;

      const instance = L.map(element.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 18,
        worldCopyJump: false,
      }).setView(iranCenter, initialZoom);

      map.current = instance;

      const syncScale = () => {
        setScale(nextScale(instance));
        setZoom(instance.getZoom());
        const center = instance.getCenter();
        const bounds = instance.getBounds();
        onViewportLevelRef.current({
          latitude: center.lat,
          longitude: center.lng,
          zoom: instance.getZoom(),
          bounds: {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
          },
        });
      };
      // The state machine advances only after the final map position is known.
      syncViewportRef.current = syncScale;
      instance.on("moveend", syncScale);
      const keepPopupVisible = () =>
        markerEntries.forEach(({ marker }) => {
          if (marker.isPopupOpen()) marker.getPopup()?.update();
        });
      instance.on("zoomend", keepPopupVisible);
      syncScale();
      setReady(true);
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (!disposed) {
            instance.invalidateSize({ pan: false });
            keepPopupVisible();
          }
        });
      });
      resizeObserver.observe(element.current);

      try {
        await addOpenFreeMapBasemap(L, instance, controller.signal);
      } catch (error) {
        if (disposed) return;
        console.error("Unable to load OpenFreeMap basemap", error);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "© OpenStreetMap contributors",
        }).addTo(instance);
      }

      if (disposed || !map.current) return;
      try {
        const response = await fetch(LIVE_MAP_THEME.provincesGeoJsonUrl, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`GeoJSON ${response.status}`);
        const data = (await response.json()) as Parameters<typeof L.geoJSON>[0];
        if (disposed || !map.current) return;

        const provinceLayer = L.geoJSON(data, {
          style: makeProvinceStyle,
          interactive: false,
        });
        if (provincesVisibleRef.current) provinceLayer.addTo(instance);
        provinceLayerRef.current = provinceLayer;
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to load Iran province boundaries", error);
        }
      }
    });

    return () => {
      disposed = true;
      controller.abort();
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      syncViewportRef.current = null;
      map.current?.remove();
      map.current = null;
      markerEntries.clear();
      provinceLayerRef.current = null;
      userLocationRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      const instance = map.current;
      if (cancelled || !instance) return;

      const wanted = new Set([
        ...squares.map((item) => `square:${item.id}`),
        ...aggregates.map((item) => `aggregate:${item.id}`),
      ]);
      for (const [key, entry] of markersRef.current) {
        if (!wanted.has(key)) {
          entry.marker.remove();
          markersRef.current.delete(key);
        }
      }

      for (const square of squares) {
        const key = `square:${square.id}`;
        const signature = JSON.stringify(square);
        const existing = markersRef.current.get(key);
        if (existing?.signature === signature) continue;
        const wasOpen = existing?.marker.isPopupOpen();
        existing?.marker.remove();
        const marker = L.marker([square.latitude, square.longitude], {
          alt: square.name,
          riseOnHover: true,
          icon: L.divIcon({
            html: squareAvatar(square),
            className: "map-marker",
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -23],
          }),
        }).addTo(instance);
        marker.bindPopup(squarePopup(square), {
          className: "map-square-popup",
          closeButton: true,
          minWidth: 230,
          maxWidth: 270,
          autoPanPaddingTopLeft: [16, 82],
          autoPanPaddingBottomRight: [64, 40],
        });
        marker.on("popupopen", () => {
          marker
            .getPopup()
            ?.getElement()
            ?.querySelector(".leaflet-popup-close-button")
            ?.setAttribute("aria-label", "بستن جزئیات میدان");
        });
        const markerElement = marker.getElement();
        markerElement?.setAttribute("aria-label", `مشاهده ${square.name}`);
        if (markerElement) markerElement.dataset.markerId = square.id;
        markersRef.current.set(key, { marker, signature });
        if (wasOpen) marker.openPopup();
      }

      for (const aggregate of aggregates) {
        const key = `aggregate:${aggregate.id}`;
        const signature = JSON.stringify([aggregate, level]);
        const existing = markersRef.current.get(key);
        if (existing?.signature === signature) continue;
        existing?.marker.remove();
        const label = `${aggregate.name} · ${aggregate.count.toLocaleString("fa-IR")} میدان`;
        const marker = L.marker([aggregate.latitude, aggregate.longitude], {
          icon: L.divIcon({
            html: makePinHtml(aggregate.count.toLocaleString("fa-IR")),
            className: "map-marker",
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
          keyboard: true,
        })
          .addTo(instance)
          .on("click", () => {
            onSelectAggregateRef.current(aggregate.id);
            instance.flyTo(
              [aggregate.latitude, aggregate.longitude],
              level === "country" ? 7 : 10,
              { animate: true, duration: 0.7 },
            );
          });
        marker.getElement()?.setAttribute("aria-label", label);
        markersRef.current.set(key, { marker, signature });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, squares, aggregates, level]);

  useEffect(() => {
    if (!ready || !map.current || !center) return;
    map.current.flyTo([center.latitude, center.longitude], center.zoom ?? 15, {
      animate: true,
      duration: 0.75,
    });
  }, [ready, center]);

  function changeZoom(delta: number) {
    if (!map.current) return;
    map.current.setZoom(map.current.getZoom() + delta, { animate: true });
  }

  function selectSearchResult(aggregate: {
    latitude: number;
    longitude: number;
    zoom: number;
  }) {
    setQuery("");
    setSearchFocused(false);
    map.current?.flyTo(
      [aggregate.latitude, aggregate.longitude],
      aggregate.zoom,
      {
        animate: true,
        duration: 0.7,
      },
    );
  }

  const scaleUnit = scale.distanceKm >= 1 ? "km" : "m";

  return (
    <div className="live-map relative h-full min-h-[430px] w-full overflow-hidden bg-[#171a1b] sm:min-h-[500px]">
      <div
        ref={element}
        dir="ltr"
        aria-label="نقشه میدان‌های ایران"
        className="absolute inset-0 h-full w-full bg-[#171a1b]"
      />

      <div className="absolute inset-x-3 top-3 z-[500]">
        <div className="flex h-[46px] items-center gap-2 rounded-full border border-white/10 bg-[#1c1c1c]/80 px-3.5 text-white/60 shadow-[0_10px_30px_-14px_rgba(0,0,0,.5)] backdrop-blur-xl">
          <Search
            className="h-[18px] w-[18px] shrink-0"
            strokeWidth={2}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            placeholder="جستجوی زندهٔ میادین…"
            className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/55"
            dir="rtl"
            aria-label="جست‌وجوی استان، شهر یا میدان روی نقشه"
          />
          <span title="به‌روزرسانی زنده" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
            <i aria-hidden="true" className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#e4152e]" />
            زنده
          </span>
        </div>

        {searchFocused && query.trim() ? (
          <div className="mt-2 overflow-hidden rounded-[14px] border border-white/10 bg-[#232526]/95 py-1 shadow-[0_12px_28px_rgba(0,0,0,.42)] backdrop-blur-xl">
            {searchResults.length ? (
              searchResults.map((aggregate) => (
                <button
                  key={aggregate.key}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSearchResult(aggregate)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-right text-[11px] font-bold text-white/90 transition hover:bg-white/[0.08]"
                  dir="rtl"
                >
                  <span className="truncate">{aggregate.name}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-white/45">
                    {aggregate.label}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-center text-[10px] text-white/45">
                نتیجه‌ای پیدا نشد
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Reference controls (.mp-ctl): three separate glass squares at the bottom-left. */}
      <div className="absolute bottom-3.5 left-3 z-[500] flex flex-col gap-2 text-white">
        <button type="button" disabled={!ready || zoom >= 18} onClick={() => changeZoom(1)} aria-label="بزرگ‌نمایی نقشه" title="بزرگ‌نمایی" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-[#1c1c1c]/80 backdrop-blur-md transition active:scale-90 disabled:opacity-35">
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" disabled={!ready || zoom <= 4} onClick={() => changeZoom(-1)} aria-label="کوچک‌نمایی نقشه" title="کوچک‌نمایی" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-[#1c1c1c]/80 backdrop-blur-md transition active:scale-90 disabled:opacity-35">
          <Minus className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => {
            map.current?.closePopup();
            map.current?.flyTo(iranCenter, initialZoom, { duration: 0.7 });
          }}
          aria-label="نمایش کل ایران"
          title="کل ایران"
          className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-[#1c1c1c]/80 backdrop-blur-md transition active:scale-90"
        >
          <LocateFixed className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>

      <div
        className="pointer-events-none absolute bottom-4 left-4 z-[450] text-[9px] font-medium text-white/85"
        style={{ width: `${scale.width}px` }}
        dir="ltr"
      >
        <div className="mb-1 flex items-end justify-between">
          <span>۰</span>
          <span>{formatScale(scale.distanceKm / 2)}</span>
          <span>
            {formatScale(scale.distanceKm)} {scaleUnit}
          </span>
        </div>
        <div className="relative h-[7px] border-b border-white/75">
          <span className="absolute bottom-0 left-0 h-[7px] border-l border-white/75" />
          <span className="absolute bottom-0 left-1/2 h-[5px] border-l border-white/65" />
          <span className="absolute bottom-0 right-0 h-[7px] border-r border-white/75" />
        </div>
      </div>

      {locationError ? (
        <button
          type="button"
          role="status"
          onClick={() => setLocationError(null)}
          className="absolute bottom-16 left-3 right-20 z-[700] rounded-xl border border-white/15 bg-[#282b2d] p-3 text-right text-[11px] leading-6 text-white shadow-lg"
        >
          {locationError}
        </button>
      ) : null}

      {!ready ? (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-[#171a1b]">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#e5544b]" />
        </div>
      ) : null}
    </div>
  );
}
