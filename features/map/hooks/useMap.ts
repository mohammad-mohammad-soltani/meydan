"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROVINCE_CENTERS } from "@/features/map/data/province-centers";
import {
  getAllSquares,
  clearAllSquaresCache,
  reverseGeocodeCached,
  type SquareMarker,
} from "../services/map.service";
import type { City, MapStatus, Province } from "../types";
import {
  aggregateByRegion,
  normalizePlace,
  provinceForPoint,
  resolveSquares,
  type ProvinceBoundaries,
  type RegionAggregate,
  type ResolvedSquare,
} from "../geo/aggregation";

import {
  getViewportLevel,
  nearestVisibleSquare,
  type MapViewport,
  type MapLevel,
} from "../geo/viewport";
export type { MapViewport, MapLevel } from "../geo/viewport";
export type CountAggregate = RegionAggregate & {
  provinceId: number | null;
  cityId: number | null;
};

const OTHER_CITY = "سایر نقاط استان";

function provinceAggregate(
  aggregate: RegionAggregate,
  squares: ResolvedSquare[],
): CountAggregate {
  const square = squares.find(
    (item) => item.displayProvinceName === aggregate.name,
  );
  const center = PROVINCE_CENTERS[aggregate.name];
  return {
    ...aggregate,
    latitude: center?.latitude ?? aggregate.latitude,
    longitude: center?.longitude ?? aggregate.longitude,
    provinceId: square?.displayProvinceId ?? null,
    cityId: null,
  };
}

function cityAggregate(
  aggregate: RegionAggregate,
  squares: ResolvedSquare[],
): CountAggregate {
  const square = squares.find((item) => item.id === aggregate.squareIds[0]);
  return {
    ...aggregate,
    provinceId: square?.displayProvinceId ?? null,
    cityId: square?.displayCityId ?? null,
  };
}

export function useMap() {
  const [allSquares, setAllSquares] = useState<SquareMarker[]>([]);
  const [boundaries, setBoundaries] = useState<ProvinceBoundaries | null>(null);
  const [resolvedSquares, setResolvedSquares] = useState<ResolvedSquare[]>([]);
  const polygonLock = useRef<{ name: string; zoom: number } | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedProvinceName, setSelectedProvinceName] = useState<
    string | null
  >(null);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [level, setLevel] = useState<MapLevel>("country");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [status, setStatus] = useState<MapStatus>("idle");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setStatus("loading");
        setError(null);
      }
    });
    void Promise.all([
      getAllSquares(),
      fetch("/maps/iran-provinces.geojson")
        .then(async (response) => {
          if (!response.ok) throw new Error(`GeoJSON ${response.status}`);
          return response.json() as Promise<ProvinceBoundaries>;
        })
        .catch(() => {
          if (active)
            setError(
              "مرزهای استان‌ها دریافت نشد؛ میدان‌ها همچنان نمایش داده می‌شوند.",
            );
          return {
            type: "FeatureCollection",
            features: [],
          } as ProvinceBoundaries;
        }),
    ])
      .then(([squares, geoJson]) => {
        if (!active) return;
        setAllSquares(squares);
        setBoundaries(geoJson);
        setStatus("ready");
      })
      .catch(() => {
        if (active) {
          setError("دریافت میدان‌ها با خطا مواجه شد. دوباره تلاش کنید.");
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => {
    clearAllSquaresCache();
    setReloadKey((value) => value + 1);
  }, []);

  // Legacy database rows are never modified. A reverse lookup only supplies
  // display fields when their stored province contradicts the point boundary.
  useEffect(() => {
    if (!boundaries) return;
    let active = true;
    const initial = resolveSquares(allSquares, boundaries);
    queueMicrotask(() => {
      if (active) setResolvedSquares(initial);
    });
    const mismatches = initial.filter((square) => square.needsCityResolution);
    if (!mismatches.length) {
      return () => {
        active = false;
      };
    }
    void Promise.all(
      mismatches.map(async (square) => {
        try {
          const location = await reverseGeocodeCached(
            square.latitude,
            square.longitude,
          );
          return [
            square.id,
            {
              displayProvinceId: location.province_id,
              displayProvinceName:
                normalizePlace(location.province_name) ||
                square.displayProvinceName,
              displayCityId: location.city_id,
              displayCityName: normalizePlace(location.city_name) || OTHER_CITY,
            },
          ] as const;
        } catch {
          return [
            square.id,
            {
              displayProvinceId: square.provinceId ?? null,
              displayProvinceName: square.displayProvinceName,
              displayCityId: null,
              displayCityName: OTHER_CITY,
            },
          ] as const;
        }
      }),
    ).then((patches) => {
      if (!active) return;
      const byId = new Map(patches);
      setResolvedSquares(
        initial.map((square) => ({
          ...square,
          ...byId.get(square.id),
          needsCityResolution: false,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [allSquares, boundaries]);

  const provinceAggregates = useMemo(
    () =>
      boundaries
        ? aggregateByRegion(resolvedSquares, boundaries, "province").map(
            (item) => provinceAggregate(item, resolvedSquares),
          )
        : [],
    [boundaries, resolvedSquares],
  );
  const allCityAggregates = useMemo(
    () =>
      boundaries
        ? aggregateByRegion(resolvedSquares, boundaries, "city").map((item) =>
            cityAggregate(item, resolvedSquares),
          )
        : [],
    [boundaries, resolvedSquares],
  );
  const cityAggregates = useMemo(
    () =>
      allCityAggregates.filter(
        (item) =>
          resolvedSquares.find((square) => square.id === item.squareIds[0])
            ?.displayProvinceName === selectedProvinceName,
      ),
    [allCityAggregates, resolvedSquares, selectedProvinceName],
  );
  const citySquares = useMemo(
    () =>
      resolvedSquares.filter(
        (item) =>
          item.displayProvinceName === selectedProvinceName &&
          (selectedCityId
            ? item.displayCityId === selectedCityId
            : item.displayCityName === selectedCityName),
      ),
    [resolvedSquares, selectedProvinceName, selectedCityId, selectedCityName],
  );
  const provinces = useMemo<Province[]>(
    () =>
      provinceAggregates
        .filter(
          (item): item is CountAggregate & { provinceId: number } =>
            item.provinceId !== null,
        )
        .map((item) => ({ id: item.provinceId, name: item.name })),
    [provinceAggregates],
  );
  const provinceCities = useMemo<City[]>(
    () =>
      cityAggregates
        .filter((city) => city.cityId !== null)
        .map((city) => ({
          id: city.cityId!,
          provinceId: selectedProvinceId,
          name: city.name,
        })),
    [cityAggregates, selectedProvinceId],
  );
  const selectedProvince = provinces.find(
    (item) => item.id === selectedProvinceId,
  );
  const selectedCity =
    provinceCities.find((item) => item.id === selectedCityId) ??
    (selectedCityName
      ? {
          id: selectedCityId,
          provinceId: selectedProvinceId,
          name: selectedCityName,
        }
      : undefined);

  const selectProvince = useCallback(
    (id: number) => {
      polygonLock.current = null;
      const province = provinceAggregates.find(
        (item) => item.provinceId === id,
      );
      setSelectedProvinceId(id);
      setSelectedProvinceName(province?.name ?? null);
      setSelectedCityId(0);
      setSelectedCityName(null);
      setCityQuery("");
      setLevel("province");
    },
    [provinceAggregates],
  );
  /** «همهٔ ایران»: back to the whole country. */
  const clearSelection = useCallback(() => {
    polygonLock.current = null;
    setSelectedProvinceId(0);
    setSelectedProvinceName(null);
    setSelectedCityId(0);
    setSelectedCityName(null);
    setCityQuery("");
    setLevel("country");
  }, []);
  /**
   * A province polygon was clicked. The choice is held while the map zooms into it, so the viewport's own
   * «nearest square» guess cannot swap it for a neighbour; zooming back out to the country releases it.
   */
  const selectProvinceByName = useCallback(
    (name: string) => {
      const province = provinceAggregates.find((item) => normalizePlace(item.name) === normalizePlace(name));
      polygonLock.current = { name: normalizePlace(name), zoom: 0 };
      setSelectedProvinceId(province?.provinceId ?? 0);
      setSelectedProvinceName(province?.name ?? name);
      setSelectedCityId(0);
      setSelectedCityName(null);
      setCityQuery("");
      setLevel("province");
    },
    [provinceAggregates],
  );
  const selectProvinceAggregate = useCallback(
    (key: string) => {
      const province = provinceAggregates.find((item) => item.id === key);
      if (province?.provinceId) selectProvince(province.provinceId);
    },
    [provinceAggregates, selectProvince],
  );
  const selectCityAggregate = useCallback(
    (key: string) => {
      const city = allCityAggregates.find((item) => item.id === key);
      if (!city) return;
      if (city.provinceId && city.provinceId !== selectedProvinceId)
        selectProvince(city.provinceId);
      setSelectedCityId(city.cityId ?? 0);
      setSelectedCityName(city.name);
      setLevel("city");
    },
    [allCityAggregates, selectedProvinceId, selectProvince],
  );
  const selectCity = useCallback(
    (id: number) => {
      const city = cityAggregates.find((item) => item.cityId === id);
      setSelectedCityId(id);
      setSelectedCityName(city?.name ?? null);
      setLevel("city");
    },
    [cityAggregates],
  );

  const setViewport = useCallback(
    (viewport: MapViewport) => {
      let nextLevel = getViewportLevel(viewport.zoom);
      // A clicked province stays chosen while the map settles on it; zooming well back out releases it.
      const lock = polygonLock.current;
      if (lock) {
        lock.zoom = Math.max(lock.zoom, viewport.zoom);
        if (viewport.zoom < lock.zoom - 1) polygonLock.current = null;
        else if (nextLevel === "country") nextLevel = "province";
      }
      setLevel(nextLevel);
      if (nextLevel === "country") {
        polygonLock.current = null;
        setSelectedProvinceId(0);
        setSelectedProvinceName(null);
        setSelectedCityId(0);
        setSelectedCityName(null);
        return;
      }
      // Use actual points in the view, never a city's averaged center. Selection
      // is only a label/list context; it does not filter the map's detail layer.
      const nearest = nearestVisibleSquare(resolvedSquares, viewport);
      const locked = polygonLock.current?.name ?? null;
      const lockedProvince = locked ? provinceAggregates.find((item) => normalizePlace(item.name) === locked) : undefined;
      if (locked) {
        const here = nearest && normalizePlace(nearest.displayProvinceName) === locked ? nearest : null;
        setSelectedProvinceId(lockedProvince?.provinceId ?? 0);
        setSelectedProvinceName(lockedProvince?.name ?? locked);
        setSelectedCityId(nextLevel === "city" ? (here?.displayCityId ?? 0) : 0);
        setSelectedCityName(nextLevel === "city" ? (here?.displayCityName ?? null) : null);
        return;
      }
      const provinceName =
        nearest?.displayProvinceName ??
        (boundaries ? provinceForPoint(viewport, boundaries)?.name : null) ??
        null;
      const province = provinceAggregates.find(
        (item) => item.name === provinceName,
      );
      setSelectedProvinceId(
        nearest?.displayProvinceId ?? province?.provinceId ?? 0,
      );
      setSelectedProvinceName(provinceName);
      setSelectedCityId(
        nextLevel === "city" ? (nearest?.displayCityId ?? 0) : 0,
      );
      setSelectedCityName(
        nextLevel === "city" ? (nearest?.displayCityName ?? null) : null,
      );
    },
    [boundaries, provinceAggregates, resolvedSquares],
  );

  return {
    selectedProvince,
    selectedProvinceName,
    selectedCity,
    selectedProvinceId,
    selectedCityId,
    provinceCities,
    visibleProvinces: provinces.filter((item) =>
      normalizePlace(item.name).includes(normalizePlace(provinceQuery)),
    ),
    visibleCities: provinceCities.filter((item) =>
      normalizePlace(item.name).includes(normalizePlace(cityQuery)),
    ),
    provinceQuery,
    cityQuery,
    level,
    provinceAggregates,
    cityAggregates,
    allCityAggregates,
    citySquares,
    resolvedSquares,
    status,
    error,
    refresh,
    activeCount: allSquares.length,
    selectProvince,
    selectCity,
    clearSelection,
    selectProvinceAggregate,
    selectProvinceByName,
    selectCityAggregate,
    setViewport,
    setProvinceQuery,
    setCityQuery,
  };
}
