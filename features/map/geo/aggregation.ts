import type { SquareMarker } from "../services/map.service";

export type GeoGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

export type ProvinceBoundary = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: GeoGeometry;
};

export type ProvinceBoundaries = {
  type: "FeatureCollection";
  features: ProvinceBoundary[];
};

export type RegionAggregate = {
  id: string;
  name: string;
  count: number;
  latitude: number;
  longitude: number;
  squareIds: string[];
};

export type ResolvedSquare = SquareMarker & {
  displayProvinceId: number | null;
  displayProvinceName: string | null;
  displayCityId: number | null;
  displayCityName: string | null;
  needsCityResolution: boolean;
};

export function normalizePlace(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function pointOnSegment(point: [number, number], a: number[], b: number[]): boolean {
  const [x, y] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-9) return false;
  return x >= Math.min(ax, bx) - 1e-9 && x <= Math.max(ax, bx) + 1e-9
    && y >= Math.min(ay, by) - 1e-9 && y <= Math.max(ay, by) + 1e-9;
}

function pointInRing(point: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const a = ring[current];
    const b = ring[previous];
    if (pointOnSegment(point, a, b)) return true;
    const intersects = ((a[1] > point[1]) !== (b[1] > point[1]))
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  return pointInRing(point, polygon[0] ?? [])
    && !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

export function pointInGeometry(point: [number, number], geometry: GeoGeometry): boolean {
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates as number[][][]);
  return (geometry.coordinates as number[][][][]).some((polygon) => pointInPolygon(point, polygon));
}

export function provinceForPoint(
  point: { latitude: number; longitude: number },
  boundaries: ProvinceBoundaries,
): { name: string; boundary: ProvinceBoundary } | null {
  const coordinate: [number, number] = [point.longitude, point.latitude];
  for (const boundary of boundaries.features) {
    if (!pointInGeometry(coordinate, boundary.geometry)) continue;
    const name = normalizePlace(String(boundary.properties?.["name:fa"] ?? boundary.properties?.name ?? ""));
    if (name) return { name, boundary };
  }
  return null;
}

export function resolveSquares(squares: SquareMarker[], boundaries: ProvinceBoundaries): ResolvedSquare[] {
  return squares.map((square) => {
    const province = provinceForPoint(square, boundaries);
    const storedProvince = normalizePlace(square.provinceName);
    const mismatch = Boolean(province && storedProvince && province.name !== storedProvince);
    return {
      ...square,
      displayProvinceName: province?.name ?? (normalizePlace(square.provinceName) || null),
      displayProvinceId: square.provinceId ?? null,
      displayCityId: square.cityId ?? null,
      displayCityName: square.cityName ?? null,
      needsCityResolution: mismatch,
    };
  });
}

export function aggregateByRegion(
  squares: SquareMarker[] | ResolvedSquare[],
  boundaries: ProvinceBoundaries,
  level: "province" | "city",
): RegionAggregate[] {
  const resolved = squares.length && "displayProvinceName" in squares[0]
    ? squares as ResolvedSquare[]
    : resolveSquares(squares as SquareMarker[], boundaries);
  const groups = new Map<string, RegionAggregate>();

  for (const square of resolved) {
    const provinceName = square.displayProvinceName;
    if (!provinceName) continue;
    const cityName = square.displayCityName || "سایر نقاط استان";
    const key = level === "province" ? provinceName : `${provinceName}|${square.displayCityId ?? "other"}|${cityName}`;
    const name = level === "province" ? provinceName : cityName;
    const current = groups.get(key) ?? {
      id: key,
      name,
      count: 0,
      latitude: 0,
      longitude: 0,
      squareIds: [],
    };
    current.latitude = (current.latitude * current.count + square.latitude) / (current.count + 1);
    current.longitude = (current.longitude * current.count + square.longitude) / (current.count + 1);
    current.count += 1;
    current.squareIds.push(square.id);
    groups.set(key, current);
  }
  return [...groups.values()];
}
