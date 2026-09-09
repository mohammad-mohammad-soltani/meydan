import type { MapLocation } from "../types";

const defaultMapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=44.0%2C25.0%2C63.5%2C40.5&layer=mapnik&marker=35.7%2C51.4";

function getMapUrl(location: MapLocation | null): string {
  if (!location) return defaultMapUrl;
  const latitudeDelta = 0.08;
  const longitudeDelta = 0.12;
  const bbox = [location.longitude - longitudeDelta, location.latitude - latitudeDelta, location.longitude + longitudeDelta, location.latitude + latitudeDelta].map((value) => value.toFixed(6)).join("%2C");
  return "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox + "&layer=mapnik&marker=" + location.latitude + "%2C" + location.longitude;
}

export function MapFrame({ location }: { location: MapLocation | null }) {
  return <div className="h-80 w-full overflow-hidden rounded-card border border-border bg-surface-sunken shadow-xs"><iframe title="نقشه زنده میادین ایران" className="block h-full w-full border-0" loading="lazy" src={getMapUrl(location)} /></div>;
}
