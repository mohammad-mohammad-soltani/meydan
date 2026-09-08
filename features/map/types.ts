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