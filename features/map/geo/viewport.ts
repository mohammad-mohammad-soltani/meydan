export type MapLevel = "country" | "province" | "city";
export type MapViewport = {
  latitude: number;
  longitude: number;
  zoom: number;
  bounds: { south: number; west: number; north: number; east: number };
};

type Point = { latitude: number; longitude: number };

// The camera determines detail; administrative centers must never determine
// whether nearby squares exist. Leaflet clips offscreen markers itself.
export function getViewportLevel(zoom: number): MapLevel {
  return zoom < 7 ? "country" : zoom < 10 ? "province" : "city";
}

export function nearestVisibleSquare<T extends Point>(
  squares: T[],
  viewport: MapViewport,
): T | null {
  const { south, west, north, east } = viewport.bounds;
  const longitudeScale = Math.cos((viewport.latitude * Math.PI) / 180);
  let nearest: T | null = null;
  let distance = Infinity;
  for (const square of squares) {
    if (
      square.latitude < south ||
      square.latitude > north ||
      square.longitude < west ||
      square.longitude > east
    )
      continue;
    const next =
      (square.latitude - viewport.latitude) ** 2 +
      ((square.longitude - viewport.longitude) * longitudeScale) ** 2;
    if (next < distance) {
      nearest = square;
      distance = next;
    }
  }
  return nearest;
}
