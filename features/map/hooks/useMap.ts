"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllSquares, getCities, type SquareMarker } from "../services/map.service";
import type { City, MapStatus, Province } from "../types";

export type MapLevel = "country" | "province" | "city";
export type CountAggregate = { id: number; name: string; count: number; latitude: number; longitude: number };
type Point = { latitude: number; longitude: number };

function distance(a: Point, b: Point): number {
  // Longitude degrees shrink with latitude. This is enough to rank nearby map points.
  const longitude = (a.longitude - b.longitude) * Math.cos((a.latitude * Math.PI) / 180);
  return (a.latitude - b.latitude) ** 2 + longitude ** 2;
}

function closestTo<T extends Point>(items: T[], center: Point): T | undefined {
  return items.reduce<T | undefined>((best, item) =>
    !best || distance(item, center) < distance(best, center) ? item : best, undefined);
}

function aggregate(items: SquareMarker[], key: "provinceId" | "cityId", nameKey: "provinceName" | "cityName"): CountAggregate[] {
  const grouped = new Map<number, CountAggregate>();
  for (const square of items) {
    const id = square[key];
    if (!id) continue;
    const item = grouped.get(id) ?? { id, name: square[nameKey] || "محدوده", count: 0, latitude: 0, longitude: 0 };
    item.latitude = (item.latitude * item.count + square.latitude) / (item.count + 1);
    item.longitude = (item.longitude * item.count + square.longitude) / (item.count + 1);
    item.count++;
    grouped.set(id, item);
  }
  return [...grouped.values()];
}

export function useMap() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceCities, setProvinceCities] = useState<City[]>([]);
  const [allSquares, setAllSquares] = useState<SquareMarker[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [level, setLevel] = useState<MapLevel>("country");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [status, setStatus] = useState<MapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<{ level: MapLevel; center: Point } | null>(null);

  const provinceAggregates = useMemo(() => aggregate(allSquares, "provinceId", "provinceName"), [allSquares]);
  const allCityAggregates = useMemo(() => aggregate(allSquares, "cityId", "cityName"), [allSquares]);
  const provinceSquares = useMemo(() => allSquares.filter((item) => item.provinceId === selectedProvinceId), [allSquares, selectedProvinceId]);
  const cityAggregates = useMemo(() => aggregate(provinceSquares, "cityId", "cityName"), [provinceSquares]);
  const citySquares = useMemo(() => provinceSquares.filter((item) => item.cityId === selectedCityId), [provinceSquares, selectedCityId]);
  const selectedProvince = provinces.find((item) => item.id === selectedProvinceId);
  const selectedCity = provinceCities.find((item) => item.id === selectedCityId);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && setStatus("loading"));
    void getAllSquares().then((items) => {
      if (!active) return;
      setAllSquares(items);
      const names = new Map<number, string>();
      for (const item of items) if (item.provinceId && item.provinceName) names.set(item.provinceId, item.provinceName);
      setProvinces([...names].map(([id, name]) => ({ id, name })));
      setStatus("ready");
    }).catch(() => {
      if (active) { setError("دریافت میدان‌ها با خطا مواجه شد."); setStatus("error"); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) { queueMicrotask(() => setProvinceCities([])); return; }
    let active = true;
    void getCities(selectedProvinceId).then((cities) => { if (active) setProvinceCities(cities); }).catch(() => { if (active) setProvinceCities([]); });
    return () => { active = false; };
  }, [selectedProvinceId]);

  const setViewportLevel = useCallback((next: MapLevel, center: Point) => {
    viewportRef.current = { level: next, center };
    if (next === "country") {
      setSelectedProvinceId(0);
      setSelectedCityId(0);
    } else if (next === "province") {
      setSelectedProvinceId(closestTo(provinceAggregates, center)?.id ?? 0);
      setSelectedCityId(0);
    } else {
      const nearestCity = closestTo(allCityAggregates, center);
      const citySquare = allSquares.find((square) => square.cityId === nearestCity?.id);
      setSelectedProvinceId(citySquare?.provinceId ?? 0);
      setSelectedCityId(nearestCity?.id ?? 0);
    }
    setLevel(next);
  }, [allSquares, allCityAggregates, provinceAggregates]);

  // The map can reach a linked coordinate before the squares request finishes.
  useEffect(() => {
    if (allSquares.length && viewportRef.current) {
      setViewportLevel(viewportRef.current.level, viewportRef.current.center);
    }
  }, [allSquares, setViewportLevel]);

  return {
    selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities,
    visibleProvinces: provinces.filter((item) => item.name.includes(provinceQuery.trim())),
    visibleCities: provinceCities.filter((item) => item.name.includes(cityQuery.trim())),
    provinceQuery, cityQuery, level, provinceAggregates, cityAggregates, citySquares,
    status, error, activeCount: allSquares.length,
    selectProvince: (id: number) => { setSelectedProvinceId(id); setSelectedCityId(0); setCityQuery(""); setLevel("province"); },
    selectCity: (id: number) => { setSelectedCityId(id); setLevel("city"); },
    setViewportLevel, setProvinceQuery, setCityQuery,
  };
}
