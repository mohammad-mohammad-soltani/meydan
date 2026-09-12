import { getCities, getProvinces } from "@/features/map/services/map.service";
import type { City, Province } from "@/features/map/types";

/**
 * Provinces and cities are reference data that never change mid-session, and
 * the register form remounts (account type toggle) can ask for them again.
 * Caching keeps that instant, and the stored promise collapses the duplicate
 * requests a remount would otherwise fire.
 */
let provincesPromise: Promise<Province[]> | null = null;
const citiesPromises = new Map<number, Promise<City[]>>();

export function loadProvinces(): Promise<Province[]> {
  provincesPromise ??= getProvinces().catch((error: unknown) => {
    provincesPromise = null;
    throw error;
  });
  return provincesPromise;
}

export function loadCities(provinceId: number): Promise<City[]> {
  const cached = citiesPromises.get(provinceId);
  if (cached) return cached;

  const request = getCities(provinceId).catch((error: unknown) => {
    citiesPromises.delete(provinceId);
    throw error;
  });
  citiesPromises.set(provinceId, request);
  return request;
}

export function clearGeoOptionsCache(): void {
  provincesPromise = null;
  citiesPromises.clear();
}
