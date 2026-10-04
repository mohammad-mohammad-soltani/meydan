"use client";

import styles from "../reference.module.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { MapBelow } from "./MapBelow";
import { MapSvg, type MapFocus as MapFocusRequest } from "./MapSvg";
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
  const [requested, setRequested] = useState<MapFocusRequest | null>(null);

  useEffect(() => {
    queueMicrotask(() => setLinkedFocus(readLinkedFocus()));
  }, []);

  // The map flies to the chosen province or city on its own; only a single square needs a request.
  const focus = useMemo<MapFocusRequest | null>(
    () => requested ?? (linkedFocus ? { latitude: linkedFocus.latitude, longitude: linkedFocus.longitude, nonce: 0 } : null),
    [requested, linkedFocus],
  );

  const handleSelectProvince = useCallback(
    (provinceId: number) => {
      setLinkedFocus(null);
      setRequested(null);
      map.selectProvince(provinceId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `map` changes every render; its actions are stable
    [map.selectProvince],
  );

  const handleSelectCity = useCallback(
    (cityId: number) => {
      setLinkedFocus(null);
      setRequested(null);
      map.selectCity(cityId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [map.selectCity],
  );

  return (
    <section
      id="view-map"
      className={`${styles.root} min-h-full bg-background text-foreground`}
    >
      <div>
        <div className={styles.viewport}>
          <div className={styles.frameHost}>
            <MapSvg
              squares={map.resolvedSquares}
              provinces={map.provinceAggregates}
              cities={map.allCityAggregates}
              selectedProvinceName={map.selectedProvince?.name ?? null}
              selectedCityName={map.selectedCity?.name ?? null}
              focus={focus}
              onSelectProvince={handleSelectProvince}
              onSelectCity={handleSelectCity}
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
          setRequested(null);
          map.clearSelection();
        }}
        onSquare={(square) => {
          setLinkedFocus(null);
          setRequested({ latitude: square.latitude, longitude: square.longitude, nonce: Date.now() });
          document.getElementById("view-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onShowMap={() => document.getElementById("view-map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
    </section>
  );
}
