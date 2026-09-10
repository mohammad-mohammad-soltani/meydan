import { meydanApi } from "@/lib/meydan-api";
import type { City, Province } from "../types";

type ApiProvince = { id: number; name: string };
type ApiCity = { id: number; province_id: number; name: string };
type ApiFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    id?: number | string;
    province_id?: number;
    province_name?: string;
    city_id?: number;
    city_name?: string;
  };
};
export type ReverseGeocodedLocation = { latitude: number; longitude: number; address: string; province_id: number | null; city_id: number | null; province_name: string | null; city_name: string | null; };

export type SquareMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  provinceId?: number | null;
  provinceName?: string | null;
  cityId?: number | null;
  cityName?: string | null;
};

export type ProvinceAggregate = {
  provinceId: number;
  name: string;
  count: number;
  latitude: number;
  longitude: number;
};

type SquareMeta = {
  provinceId?: number | null;
  provinceName?: string | null;
  cityId?: number | null;
  cityName?: string | null;
};

function toFiniteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function featuresToSquares(features: ApiFeature[], prefix: string, meta?: SquareMeta): SquareMarker[] {
  const squares: SquareMarker[] = [];
  for (const feature of features) {
    const coordinates = feature.geometry?.coordinates;
    const longitude = coordinates?.[0];
    const latitude = coordinates?.[1];
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      squares.push({
        id: String(feature.properties?.id ?? `${prefix}-${squares.length}`),
        name: feature.properties?.name || "میدان",
        latitude: latitude as number,
        longitude: longitude as number,
        provinceId: toFiniteNumber(feature.properties?.province_id) ?? meta?.provinceId ?? null,
        provinceName: feature.properties?.province_name ?? meta?.provinceName ?? null,
        cityId: toFiniteNumber(feature.properties?.city_id) ?? meta?.cityId ?? null,
        cityName: feature.properties?.city_name ?? meta?.cityName ?? null,
      });
    }
  }
  return squares;
}

export async function getProvinces(): Promise<Province[]> {
  return (await meydanApi<ApiProvince[]>("/geo/provinces")).map((item) => ({ id: item.id, name: item.name }));
}

export async function getCities(provinceId: number): Promise<City[]> {
  return (await meydanApi<ApiCity[]>(`/geo/cities?province_id=${provinceId}`)).map((item) => ({ id: item.id, provinceId: item.province_id, name: item.name }));
}

export async function getCityMap(cityId: number): Promise<{ squares: SquareMarker[]; center: { latitude: number; longitude: number } | null; activeCount: number }> {
  const data = await meydanApi<{ features?: ApiFeature[] }>(`/squares/map?city_id=${cityId}`);
  const squares = featuresToSquares(data.features || [], `city-${cityId}`);
  return {
    squares,
    center: squares.length > 0
      ? {
          latitude: squares.reduce((sum, s) => sum + s.latitude, 0) / squares.length,
          longitude: squares.reduce((sum, s) => sum + s.longitude, 0) / squares.length,
        }
      : null,
    activeCount: squares.length,
  };
}

// Fetch ALL squares across every province/city so the live map always
// shows every red dot, no matter what is selected in the dropdowns.
// Strategy: try the unfiltered endpoint first (single call); if the
// backend requires city_id, fall back to per-city fetching.
let allSquaresCache: SquareMarker[] | null = null;

export async function getAllSquares(): Promise<SquareMarker[]> {
  if (allSquaresCache) return allSquaresCache;

  // 1) Try unfiltered endpoint — returns everything in one call if supported.
  try {
    const data = await meydanApi<{ features?: ApiFeature[] }>("/squares/map");
    const squares = featuresToSquares(data.features || [], "all");
    if (squares.length > 0) {
      allSquaresCache = squares;
      return squares;
    }
    // Empty but valid response: backend supports it, there are just no squares.
    if (Array.isArray(data.features)) {
      allSquaresCache = squares;
      return squares;
    }
  } catch {
    // Fall through to per-city fetching.
  }

  // 2) Fallback: provinces → cities (parallel) → squares per city (parallel).
  const provinces = await getProvinces();
  const citiesByProvince = await Promise.all(
    provinces.map((province) =>
      getCities(province.id)
        .then((cities): { province: Province; cities: City[] } => ({ province, cities }))
        .catch((): { province: Province; cities: City[] } => ({ province, cities: [] })),
    ),
  );
  const squaresByCity = await Promise.all(
    citiesByProvince.flatMap(({ province, cities }) =>
      cities.map((city) =>
        meydanApi<{ features?: ApiFeature[] }>(`/squares/map?city_id=${city.id}`)
          .then((data) =>
            featuresToSquares(data.features || [], `city-${city.id}`, {
              provinceId: province.id,
              provinceName: province.name,
              cityId: city.id,
              cityName: city.name,
            }),
          )
          .catch((): SquareMarker[] => []),
      ),
    ),
  );

  allSquaresCache = squaresByCity.flat();
  return allSquaresCache;
}

export function clearAllSquaresCache(): void {
  allSquaresCache = null;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodedLocation> {
  return meydanApi<ReverseGeocodedLocation>(`/geo/reverse?latitude=${latitude}&longitude=${longitude}`);
}
