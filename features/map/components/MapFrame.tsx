"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProvinceAggregate, SquareMarker } from "../services/map.service";

const iranCenter: [number, number] = [35.6892, 51.389];

function badgeHtml(count: string): string {
  return (
    `<div style="display:grid;place-items:center;width:46px;height:46px;border-radius:9999px;` +
    `background:rgba(239,68,68,0.94);border:2.5px solid #ffffff;color:#ffffff;` +
    `font-size:15px;font-weight:900;font-family:inherit;box-shadow:0 4px 14px rgba(0,0,0,0.35);cursor:pointer">` +
    `${count}</div>`
  );
}

export function MapFrame({
  selectedSquares,
  aggregates,
  center,
  onSelectProvince,
}: {
  selectedSquares: SquareMarker[];
  aggregates: ProvinceAggregate[];
  center: { latitude: number; longitude: number } | null;
  onSelectProvince: (provinceId: number) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Layer[]>([]);
  const onSelectProvinceRef = useRef(onSelectProvince);
  const [ready, setReady] = useState(false);
  const fittedAllRef = useRef(false);

  useEffect(() => {
    onSelectProvinceRef.current = onSelectProvince;
  }, [onSelectProvince]);

  // Init map once
  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      const instance = L.map(element.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(iranCenter, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(instance);
      L.control.zoom({ position: "topleft" }).addTo(instance);
      map.current = instance;
      setReady(true);
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      markersRef.current = [];
    };
  }, []);

  // Markers: red dots for the selected province + count badges for the rest.
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !map.current) return;

      for (const layer of markersRef.current) layer.remove();
      markersRef.current = [];

      for (const square of selectedSquares) {
        const point: [number, number] = [square.latitude, square.longitude];
        const marker = L.circleMarker(point, {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#ef4444",
          fillOpacity: 1,
        })
          .addTo(map.current!)
          .bindPopup(
            `<div style="font-family:inherit;text-align:center;padding:2px 6px"><strong style="font-size:12px">${square.name}</strong></div>`,
            { closeButton: false },
          );
        markersRef.current.push(marker);
      }

      for (const aggregate of aggregates) {
        const badge = L.marker([aggregate.latitude, aggregate.longitude], {
          icon: L.divIcon({
            html: badgeHtml(aggregate.count.toLocaleString("fa-IR")),
            className: "",
            iconSize: [46, 46],
            iconAnchor: [23, 23],
          }),
          keyboard: false,
        })
          .addTo(map.current!)
          .bindTooltip(`${aggregate.name} · ${aggregate.count.toLocaleString("fa-IR")} میدان`, {
            direction: "top",
            offset: [0, -24],
          })
          .on("click", () => onSelectProvinceRef.current(aggregate.provinceId));
        markersRef.current.push(badge);
      }

      // First load: fit everything (dots + badges) in one country view.
      if (!fittedAllRef.current && (selectedSquares.length > 0 || aggregates.length > 0)) {
        fittedAllRef.current = true;
        const points: [number, number][] = [
          ...selectedSquares.map((s) => [s.latitude, s.longitude] as [number, number]),
          ...aggregates.map((a) => [a.latitude, a.longitude] as [number, number]),
        ];
        if (points.length === 1) {
          map.current.setView(points[0], 12);
        } else {
          map.current.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 10 });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, selectedSquares, aggregates]);

  // Dropdown selection only moves the view — markers are untouched.
  useEffect(() => {
    if (!ready || !map.current || !center) return;
    map.current.setView([center.latitude, center.longitude], 11);
  }, [ready, center]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-card border border-border bg-surface-sunken shadow-xs">
      <div ref={element} className="h-full w-full" />
      {!ready ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-sunken/80">
          <LoaderCircle className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : null}
    </div>
  );
}
