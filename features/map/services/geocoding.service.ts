import type { GeocodingRequest, GeocodingResponse, MapLocation } from "../types";

export async function geocodeLocation(request: GeocodingRequest): Promise<MapLocation> {
  const query = new URLSearchParams(request);
  const response = await fetch("/api/geocoding?" + query.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "خطا در دریافت موقعیت" })) as { error?: string };
    throw new Error(error.error ?? "خطا در دریافت موقعیت");
  }

  const payload = await response.json() as GeocodingResponse;
  return payload.location;
}