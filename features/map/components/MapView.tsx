"use client";

import styles from "../reference.module.css";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { MapBelow } from "./MapBelow";
import { MapFrame } from "./MapFrame";
import { useMap } from "../hooks/useMap";

type MapFocus = { latitude: number; longitude: number; zoom?: number };

function readLinkedFocus(): MapFocus | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const latParam = params.get("lat");
  const lngParam = params.get("lng");
  if (!latParam || !lngParam) return null;

  const latitude = Number(latParam);
  const longitude = Number(lngParam);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function MapView() {
  const map = useMap();
  // A square profile links here with ?lat=&lng= so the live map opens on that
  // square. The URL is read directly to avoid a useSearchParams boundary.
  const [linkedFocus, setLinkedFocus] = useState<MapFocus | null>(null);
  const [requestedFocus, setRequestedFocus] = useState<MapFocus | null>(null);

  useEffect(() => {
    queueMicrotask(() => setLinkedFocus(readLinkedFocus()));
  }, []);

  const handleSelectProvince = (provinceId: number) => {
    setLinkedFocus(null);
    map.selectProvince(provinceId);
    const province = map.provinceAggregates.find((item) => item.provinceId === provinceId);
    if (province) setRequestedFocus({ latitude: province.latitude, longitude: province.longitude, zoom: 7.2 });
  };

  // A province polygon was clicked: the frame zooms on its own, so only the selection is set here.
  const handleSelectProvinceName = (name: string) => {
    setLinkedFocus(null);
    setRequestedFocus(null);
    map.selectProvinceByName(name);
  };

  const handleSelectCity = (cityId: number) => {
    setLinkedFocus(null);
    map.selectCity(cityId);
    const city = map.cityAggregates.find((item) => item.cityId === cityId);
    if (city) setRequestedFocus({ latitude: city.latitude, longitude: city.longitude, zoom: 10.2 });
  };

  const mapMarkers =
    map.level === "country"
      ? { squares: [], aggregates: map.provinceAggregates, onSelect: map.selectProvinceAggregate }
      : map.level === "province"
        ? { squares: [], aggregates: map.allCityAggregates, onSelect: map.selectCityAggregate }
        : { squares: map.resolvedSquares, aggregates: [], onSelect: map.selectCityAggregate };

  return (
    <section
      id="view-map"
      className={`${styles.root} min-h-full bg-background text-foreground`}
    >
      <div>
        <div className={styles.viewport}>
          <div className={styles.frameHost}>
            <MapFrame
              squares={mapMarkers.squares}
              aggregates={mapMarkers.aggregates}
              searchProvinces={map.provinceAggregates}
              searchCities={map.allCityAggregates}
              searchSquares={map.resolvedSquares}
              center={linkedFocus ?? requestedFocus}
              level={map.level}
              onSelectAggregate={mapMarkers.onSelect}
              onViewportLevel={map.setViewport}
              selectedProvinceName={map.selectedProvinceName}
              onSelectProvinceName={handleSelectProvinceName}
            />
          </div>

          {map.status === "loading" && map.activeCount === 0 ? (
            <div className="absolute inset-0 z-[700] grid place-items-center bg-black/30 backdrop-blur-[1px]">
              <div className={`${styles.loadingBadge} flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-card`}>
                <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
                در حال دریافت میدان‌ها…
              </div>
            </div>
          ) : null}

          {map.error ? (
            <div className="absolute inset-x-3 bottom-3 z-[700] rounded-[14px] border border-danger-border bg-danger-surface px-3 py-2.5 text-[11px] leading-5 text-danger shadow-sm">
              {map.error}
              <button
                type="button"
                onClick={map.refresh}
                disabled={map.status === "loading"}
                className="ms-2 underline underline-offset-4 disabled:opacity-50"
              >
                تلاش دوباره
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <MapBelow
        map={map}
        onProvince={handleSelectProvince}
        onCity={handleSelectCity}
        onAll={() => {
          setLinkedFocus(null);
          map.clearSelection();
          setRequestedFocus({ latitude: 32.4, longitude: 53.7, zoom: 4.6 });
        }}
        onSquare={(square) => {
          setLinkedFocus(null);
          setRequestedFocus({ latitude: square.latitude, longitude: square.longitude, zoom: 15 });
          document.getElementById("view-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onShowMap={() => document.getElementById("view-map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
    </section>
  );
}
