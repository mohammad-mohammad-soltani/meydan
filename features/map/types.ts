export type Province = { id: number; name: string; };
export type City = { id: number; name: string; provinceId: number; };

export type MapLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export type GeocodingRequest = { city: string; province: string; };
export type GeocodingResponse = { location: MapLocation; };

export type MapStatus = "idle" | "loading" | "ready" | "error";

/** A point chosen on the picker map, enriched with its reverse-geocoded address. */
export type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  provinceId: number | null;
  cityId: number | null;
  provinceName: string | null;
  cityName: string | null;
};

/**
 * Imperative re-center request. The nonce distinguishes repeated requests for
 * the same point, so an effect keyed on it only recenters when actually asked.
 */
export type MapFocusRequest = {
  latitude: number;
  longitude: number;
  zoom: number;
  nonce: number;
};