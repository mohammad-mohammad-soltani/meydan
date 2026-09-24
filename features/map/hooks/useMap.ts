"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVINCE_CENTERS } from "@/features/auth/data/province-centers";
import { getAllSquares, getCities, reverseGeocodeCached, type SquareMarker } from "../services/map.service";
import type { City, MapStatus, Province } from "../types";
import {
  aggregateByRegion, normalizePlace, provinceForPoint, resolveSquares,
  type ProvinceBoundaries, type RegionAggregate, type ResolvedSquare,
} from "../geo/aggregation";

export type MapLevel = "country" | "province" | "city";
export type CountAggregate = RegionAggregate & { provinceId: number | null; cityId: number | null };
export type MapViewport = {
  latitude: number; longitude: number; zoom: number;
  bounds: { south: number; west: number; north: number; east: number };
};

const OTHER_CITY = "سایر نقاط استان";

function inViewport(point: { latitude: number; longitude: number }, bounds: MapViewport["bounds"]): boolean {
  return point.latitude >= bounds.south && point.latitude <= bounds.north
    && point.longitude >= bounds.west && point.longitude <= bounds.east;
}

function provinceAggregate(aggregate: RegionAggregate, squares: ResolvedSquare[]): CountAggregate {
  const square = squares.find((item) => item.displayProvinceName === aggregate.name);
  const center = PROVINCE_CENTERS[aggregate.name];
  return { ...aggregate, latitude: center?.latitude ?? aggregate.latitude, longitude: center?.longitude ?? aggregate.longitude, provinceId: square?.displayProvinceId ?? null, cityId: null };
}

function cityAggregate(aggregate: RegionAggregate, squares: ResolvedSquare[]): CountAggregate {
  const square = squares.find((item) => item.id === aggregate.squareIds[0]);
  return { ...aggregate, provinceId: square?.displayProvinceId ?? null, cityId: square?.displayCityId ?? null };
}

export function useMap() {
  const [provinceCities, setProvinceCities] = useState<City[]>([]);
  const [allSquares, setAllSquares] = useState<SquareMarker[]>([]);
  const [boundaries, setBoundaries] = useState<ProvinceBoundaries | null>(null);
  const [resolvedSquares, setResolvedSquares] = useState<ResolvedSquare[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [level, setLevel] = useState<MapLevel>("country");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [status, setStatus] = useState<MapStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && setStatus("loading"));
    void Promise.all([
      getAllSquares(),
      fetch("/maps/iran-provinces.geojson").then(async (response) => {
        if (!response.ok) throw new Error(`GeoJSON ${response.status}`);
        return response.json() as Promise<ProvinceBoundaries>;
      }),
    ]).then(([squares, geoJson]) => {
      if (!active) return;
      setAllSquares(squares); setBoundaries(geoJson); setStatus("ready");
    }).catch(() => {
      if (active) { setError("دریافت میدان‌ها یا مرزهای نقشه با خطا مواجه شد."); setStatus("error"); }
    });
    return () => { active = false; };
  }, []);

  // Legacy database rows are never modified. A reverse lookup only supplies
  // display fields when their stored province contradicts the point boundary.
  useEffect(() => {
    if (!boundaries) return;
    let active = true;
    const initial = resolveSquares(allSquares, boundaries);
    const mismatches = initial.filter((square) => square.needsCityResolution);
    if (!mismatches.length) {
      queueMicrotask(() => { if (active) setResolvedSquares(initial); });
      return () => { active = false; };
    }
    void Promise.all(mismatches.map(async (square) => {
      try {
        const location = await reverseGeocodeCached(square.latitude, square.longitude);
        return [square.id, {
          displayProvinceId: location.province_id,
          displayProvinceName: normalizePlace(location.province_name) || square.displayProvinceName,
          displayCityId: location.city_id,
          displayCityName: normalizePlace(location.city_name) || OTHER_CITY,
        }] as const;
      } catch {
        return [square.id, { displayProvinceId: square.provinceId ?? null, displayProvinceName: square.displayProvinceName, displayCityId: null, displayCityName: OTHER_CITY }] as const;
      }
    })).then((patches) => {
      if (!active) return;
      const byId = new Map(patches);
      setResolvedSquares(initial.map((square) => ({ ...square, ...byId.get(square.id), needsCityResolution: false })));
    });
    return () => { active = false; };
  }, [allSquares, boundaries]);

  useEffect(() => {
    if (!selectedProvinceId) { queueMicrotask(() => setProvinceCities([])); return; }
    let active = true;
    void getCities(selectedProvinceId).then((cities) => { if (active) setProvinceCities(cities); }).catch(() => { if (active) setProvinceCities([]); });
    return () => { active = false; };
  }, [selectedProvinceId]);

  const provinceAggregates = useMemo(() => boundaries
    ? aggregateByRegion(resolvedSquares, boundaries, "province").map((item) => provinceAggregate(item, resolvedSquares))
    : [], [boundaries, resolvedSquares]);
  const cityAggregates = useMemo(() => boundaries && selectedProvinceName
    ? aggregateByRegion(resolvedSquares.filter((item) => item.displayProvinceName === selectedProvinceName), boundaries, "city").map((item) => cityAggregate(item, resolvedSquares))
    : [], [boundaries, resolvedSquares, selectedProvinceName]);
  const citySquares = useMemo(() => resolvedSquares.filter((item) => item.displayProvinceName === selectedProvinceName
    && (selectedCityId ? item.displayCityId === selectedCityId : item.displayCityName === selectedCityName)),
  [resolvedSquares, selectedProvinceName, selectedCityId, selectedCityName]);
  const provinces = useMemo<Province[]>(() => provinceAggregates
    .filter((item): item is CountAggregate & { provinceId: number } => item.provinceId !== null)
    .map((item) => ({ id: item.provinceId, name: item.name })), [provinceAggregates]);
  const selectedProvince = provinces.find((item) => item.id === selectedProvinceId);
  const selectedCity = provinceCities.find((item) => item.id === selectedCityId)
    ?? (selectedCityName ? { id: selectedCityId, provinceId: selectedProvinceId, name: selectedCityName } : undefined);

  const selectProvince = useCallback((id: number) => {
    const province = provinceAggregates.find((item) => item.provinceId === id);
    setSelectedProvinceId(id); setSelectedProvinceName(province?.name ?? null);
    setSelectedCityId(0); setSelectedCityName(null); setCityQuery(""); setLevel("province");
  }, [provinceAggregates]);
  const selectProvinceAggregate = useCallback((key: string) => {
    const province = provinceAggregates.find((item) => item.id === key);
    if (province?.provinceId) selectProvince(province.provinceId);
  }, [provinceAggregates, selectProvince]);
  const selectCityAggregate = useCallback((key: string) => {
    const city = cityAggregates.find((item) => item.id === key);
    if (!city) return;
    if (city.provinceId && city.provinceId !== selectedProvinceId) selectProvince(city.provinceId);
    setSelectedCityId(city.cityId ?? 0); setSelectedCityName(city.name); setLevel("city");
  }, [cityAggregates, selectedProvinceId, selectProvince]);
  const selectCity = useCallback((id: number) => {
    const city = cityAggregates.find((item) => item.cityId === id);
    setSelectedCityId(id); setSelectedCityName(city?.name ?? null); setLevel("city");
  }, [cityAggregates]);

  const setViewport = useCallback((viewport: MapViewport) => {
    if (!boundaries) return;
    const province = provinceForPoint(viewport, boundaries);
    if (viewport.zoom < 6.5 || !province || (level === "country" && viewport.zoom < 7)) {
      setLevel("country"); setSelectedProvinceId(0); setSelectedProvinceName(null); setSelectedCityId(0); setSelectedCityName(null); return;
    }
    const selected = provinceAggregates.find((item) => item.name === province.name);
    if (!selected?.provinceId) return;
    if (viewport.zoom < 10 && !(level === "city" && viewport.zoom >= 9.5)) {
      setLevel("province"); setSelectedProvinceId(selected.provinceId); setSelectedProvinceName(province.name); setSelectedCityId(0); setSelectedCityName(null); return;
    }
    const candidates = aggregateByRegion(
      resolvedSquares.filter((item) => item.displayProvinceName === province.name),
      boundaries,
      "city",
    ).map((item) => cityAggregate(item, resolvedSquares));
    const candidate = candidates.find((city) => inViewport(city, viewport.bounds));
    if (!candidate) {
      setLevel("province"); setSelectedProvinceId(selected.provinceId); setSelectedProvinceName(province.name); setSelectedCityId(0); setSelectedCityName(null); return;
    }
    setLevel("city"); setSelectedProvinceId(selected.provinceId); setSelectedProvinceName(province.name); setSelectedCityId(candidate.cityId ?? 0); setSelectedCityName(candidate.name);
  }, [boundaries, level, provinceAggregates, resolvedSquares]);

  return {
    selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities,
    visibleProvinces: provinces.filter((item) => item.name.includes(provinceQuery.trim())),
    visibleCities: provinceCities.filter((item) => item.name.includes(cityQuery.trim())),
    provinceQuery, cityQuery, level, provinceAggregates, cityAggregates, citySquares,
    status, error, activeCount: allSquares.length,
    selectProvince, selectCity, selectProvinceAggregate, selectCityAggregate,
    setViewport, setProvinceQuery, setCityQuery,
  };
}
