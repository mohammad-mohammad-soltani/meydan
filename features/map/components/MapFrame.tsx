"use client";

import {
  Layers3,
  LoaderCircle,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProvinceAggregate, SquareMarker } from "../services/map.service";
import { addOpenFreeMapBasemap } from "../services/openfreemap-basemap";
import {
  LIVE_MAP_THEME,
  makePinHtml,
  makeProvinceStyle,
} from "../map-theme";

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
  if (value >= 1) return value.toLocaleString("fa-IR", { maximumFractionDigits: 0 });
  return (value * 1000).toLocaleString("fa-IR", { maximumFractionDigits: 0 });
}

export function MapFrame({
  selectedSquares,
  aggregates,
  center,
  onSelectProvince,
}: {
  selectedSquares: SquareMarker[];
  aggregates: ProvinceAggregate[];
  center: { latitude: number; longitude: number } | null;
  onSelectProvince: (provinceId: number) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Layer[]>([]);
  const provinceLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const userLocationRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onSelectProvinceRef = useRef(onSelectProvince);
  const [ready, setReady] = useState(false);
  const [provincesVisible, setProvincesVisible] = useState(true);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [scale, setScale] = useState<ScaleState>({ distanceKm: 500, width: 120 });
  const fittedAllRef = useRef(false);

  useEffect(() => {
    onSelectProvinceRef.current = onSelectProvince;
  }, [onSelectProvince]);

  const searchResults = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return [];
    return aggregates
      .filter((item) => item.name.includes(normalized))
      .slice(0, 6);
  }, [aggregates, query]);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();

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

      const syncScale = () => setScale(nextScale(instance));
      instance.on("zoomend moveend", syncScale);
      syncScale();

      try {
        await addOpenFreeMapBasemap(L, instance);
      } catch (error) {
        console.error("Unable to load OpenFreeMap basemap", error);
      }

      if (disposed || !map.current) return;
      setReady(true);

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
        }).addTo(instance);
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
      map.current?.remove();
      map.current = null;
      markersRef.current = [];
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

      for (const layer of markersRef.current) layer.remove();
      markersRef.current = [];

      for (const square of selectedSquares) {
        const point: [number, number] = [square.latitude, square.longitude];
        const marker = L.circleMarker(point, {
          radius: 6,
          color: "rgba(255,255,255,.9)",
          weight: 1.5,
          fillColor: LIVE_MAP_THEME.pin,
          fillOpacity: 1,
        })
          .addTo(instance)
          .bindPopup(
            `<div style="font-family:inherit;text-align:center;padding:2px 6px"><strong style="font-size:12px">${square.name}</strong></div>`,
            { closeButton: false },
          );
        markersRef.current.push(marker);
      }

      for (const aggregate of aggregates) {
        const marker = L.marker([aggregate.latitude, aggregate.longitude], {
          icon: L.divIcon({
            html: makePinHtml(aggregate.count.toLocaleString("fa-IR")),
            className: "",
            iconSize: [36, 44],
            iconAnchor: [18, 44],
          }),
          keyboard: false,
        })
          .addTo(instance)
          .bindTooltip(`${aggregate.name} · ${aggregate.count.toLocaleString("fa-IR")} میدان`, {
            direction: "top",
            offset: [0, -38],
            opacity: 0.92,
          })
          .on("click", () => onSelectProvinceRef.current(aggregate.provinceId));
        markersRef.current.push(marker);
      }

      if (!fittedAllRef.current && (selectedSquares.length > 0 || aggregates.length > 0)) {
        fittedAllRef.current = true;
        const points: [number, number][] = [
          ...selectedSquares.map((square) => [square.latitude, square.longitude] as [number, number]),
          ...aggregates.map((aggregate) => [aggregate.latitude, aggregate.longitude] as [number, number]),
        ];

        if (points.length === 1) {
          instance.setView(points[0], 8);
        } else {
          instance.fitBounds(L.latLngBounds(points), {
            paddingTopLeft: [42, 78],
            paddingBottomRight: [42, 58],
            maxZoom: 6,
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, selectedSquares, aggregates]);

  useEffect(() => {
    if (!ready || !map.current || !center) return;
    map.current.flyTo([center.latitude, center.longitude], 10.5, {
      animate: true,
      duration: 0.75,
    });
  }, [ready, center]);

  function changeZoom(delta: number) {
    if (!map.current) return;
    map.current.setZoom(map.current.getZoom() + delta, { animate: true });
  }

  function toggleProvinceLayer() {
    const instance = map.current;
    const layer = provinceLayerRef.current;
    if (!instance || !layer) return;

    if (instance.hasLayer(layer)) {
      layer.removeFrom(instance);
      setProvincesVisible(false);
      return;
    }

    layer.addTo(instance);
    setProvincesVisible(true);
  }

  function selectSearchResult(aggregate: ProvinceAggregate) {
    setQuery("");
    setSearchFocused(false);
    map.current?.flyTo([aggregate.latitude, aggregate.longitude], 7, {
      animate: true,
      duration: 0.7,
    });
    onSelectProvinceRef.current(aggregate.provinceId);
  }

  function locateUser() {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        map.current?.flyTo(point, 12, { animate: true, duration: 0.8 });

        void import("leaflet").then((L) => {
          if (!map.current) return;
          userLocationRef.current?.remove();
          userLocationRef.current = L.circleMarker(point, {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: "#e5544b",
            fillOpacity: 1,
          }).addTo(map.current);
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const scaleUnit = scale.distanceKm >= 1 ? "km" : "m";

  return (
    <div className="relative h-full min-h-[430px] w-full overflow-hidden bg-[#171a1b] sm:min-h-[500px]">
      <div ref={element} className="absolute inset-0 h-full w-full bg-[#171a1b]" />

      <div className="absolute left-3 top-3 z-[500] w-[min(58vw,230px)] sm:left-4 sm:top-4">
        <div className="flex h-12 items-center gap-2 rounded-[16px] border border-white/10 bg-[#2a2b2c]/90 px-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <Search className="h-5 w-5 shrink-0 text-white/95" strokeWidth={2.1} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            placeholder="جست‌وجوی استان"
            className="min-w-0 flex-1 border-0 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/35"
            dir="rtl"
            aria-label="جست‌وجوی استان روی نقشه"
          />
        </div>

        {searchFocused && query.trim() ? (
          <div className="mt-2 overflow-hidden rounded-[14px] border border-white/10 bg-[#232526]/95 py-1 shadow-[0_12px_28px_rgba(0,0,0,.42)] backdrop-blur-xl">
            {searchResults.length ? (
              searchResults.map((aggregate) => (
                <button
                  key={aggregate.provinceId}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSearchResult(aggregate)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-right text-[11px] font-bold text-white/90 transition hover:bg-white/[0.08]"
                  dir="rtl"
                >
                  <span className="truncate">{aggregate.name}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-white/45">
                    {aggregate.count.toLocaleString("fa-IR")}
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

      <button
        type="button"
        onClick={toggleProvinceLayer}
        aria-label="نمایش یا پنهان کردن مرز استان‌ها"
        aria-pressed={provincesVisible}
        className={`absolute right-3 top-3 z-[500] grid h-12 w-12 place-items-center rounded-[16px] border text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-xl transition sm:right-4 sm:top-4 ${
          provincesVisible
            ? "border-white/15 bg-[#303132]/92"
            : "border-white/8 bg-[#242526]/80 text-white/55"
        }`}
      >
        <Layers3 className="h-[22px] w-[22px]" strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={locateUser}
        aria-label="نمایش موقعیت من"
        className="absolute bottom-[70px] left-3 z-[500] grid h-12 w-12 place-items-center rounded-[16px] border border-white/10 bg-[#2a2b2c]/90 text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-xl transition hover:bg-[#343536]/95 sm:left-4"
      >
        <Navigation className="h-[22px] w-[22px] -rotate-12" strokeWidth={2} />
      </button>

      <div className="absolute bottom-3 right-3 z-[500] flex w-12 flex-col items-center gap-1 rounded-[18px] border border-white/10 bg-[#242627]/92 p-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,.36)] backdrop-blur-xl sm:bottom-4 sm:right-4">
        <button
          type="button"
          onClick={() => changeZoom(1)}
          aria-label="بزرگ‌نمایی نقشه"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] transition hover:bg-white/[0.14]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <span className="h-px w-7 bg-white/[0.08]" />
        <button
          type="button"
          onClick={() => changeZoom(-1)}
          aria-label="کوچک‌نمایی نقشه"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] transition hover:bg-white/[0.14]"
        >
          <Minus className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <span className="h-px w-7 bg-white/[0.08]" />
        <button
          type="button"
          onClick={locateUser}
          aria-label="تمرکز روی موقعیت من"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] transition hover:bg-white/[0.14]"
        >
          <LocateFixed className="h-[19px] w-[19px]" strokeWidth={2} />
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

      <div className="absolute bottom-1 left-1/2 z-[450] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-[8px] text-white/30">
        <a
          href="https://openfreemap.org"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-white/55"
        >
          OpenFreeMap © OpenMapTiles
        </a>
        <span>·</span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-white/55"
        >
          Data © OpenStreetMap
        </a>
      </div>

      {!ready ? (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-[#171a1b]">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#e5544b]" />
        </div>
      ) : null}
    </div>
  );
}
