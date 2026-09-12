import { geocodeLocation } from "@/features/map/services/geocoding.service";
import type { City, Province } from "@/features/map/types";
import { IRAN_CENTER, PROVINCE_CENTERS } from "../data/province-centers";

export function getIranCenter(): { latitude: number; longitude: number } {
  return IRAN_CENTER;
}

export function getProvinceCenter(province: Province | null): {
  latitude: number;
  longitude: number;
} {
  if (!province) return IRAN_CENTER;
  return PROVINCE_CENTERS[province.name] ?? IRAN_CENTER;
}

// The geocoding route is already server-cached for 12h; this memo keeps
// repeated selects of the same city from even making the round trip.
const cityCenters = new Map<number, Promise<{ latitude: number; longitude: number }>>();

export function resolveCityCenter(
  city: City,
  province: Province | null,
): Promise<{ latitude: number; longitude: number }> {
  const cached = cityCenters.get(city.id);
  if (cached) return cached;

  const fallback = getProvinceCenter(province);
  const request = geocodeLocation({
    city: city.name,
    province: province?.name ?? "Iran",
  })
    .then((location) => ({
      latitude: location.latitude,
      longitude: location.longitude,
    }))
    .catch((): { latitude: number; longitude: number } => fallback);

  cityCenters.set(city.id, request);
  return request;
}

export function clearAreaCenterCache(): void {
  cityCenters.clear();
}
