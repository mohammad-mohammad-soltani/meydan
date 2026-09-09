import { meydanApi } from "@/lib/meydan-api";
import type { City, MapLocation, Province } from "../types";

type ApiProvince = { id: number; name: string };
type ApiCity = { id: number; province_id: number; name: string };
type ApiFeature = { geometry?: { coordinates?: [number, number] }; properties?: { name?: string } };

export async function getProvinces(): Promise<Province[]> {
  return (await meydanApi<ApiProvince[]>("/geo/provinces")).map((item) => ({ id: item.id, name: item.name }));
}

export async function getCities(provinceId: number): Promise<City[]> {
  return (await meydanApi<ApiCity[]>(`/geo/cities?province_id=${provinceId}`)).map((item) => ({ id: item.id, provinceId: item.province_id, name: item.name }));
}

export async function getCityMap(cityId: number): Promise<{ location: MapLocation | null; activeCount: number }> {
  const data = await meydanApi<{ features?: ApiFeature[] }>(`/squares/map?city_id=${cityId}`);
  const features = data.features || [];
  const first = features[0];
  const coordinates = first?.geometry?.coordinates;
  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];
  return {
    activeCount: features.length,
    location: Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude: latitude as number, longitude: longitude as number, label: first?.properties?.name || "" }
      : null,
  };
}
