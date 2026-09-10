"use client";

import { Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";

export type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  provinceId: number | null;
  cityId: number | null;
  provinceName: string | null;
  cityName: string | null;
};

type ReverseResponse = {
  latitude: number;
  longitude: number;
  address: string;
  province_id: number | null;
  city_id: number | null;
  province_name: string | null;
  city_name: string | null;
};

const iranCenter: [number, number] = [35.6892, 51.389];

export function LocationPickerMap({ onSelect }: { onSelect: (location: SelectedLocation) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const marker = useRef<import("leaflet").CircleMarker | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [notice, setNotice] = useState("روی نقشه بزنید تا موقعیت شما انتخاب شود.");

  const select = useCallback(async (latitude: number, longitude: number) => {
    setStatus("loading");
    setNotice("در حال تشخیص آدرس، شهر و استان…");
    try {
      const L = await import("leaflet");
      const point: [number, number] = [latitude, longitude];
      if (!marker.current && map.current) marker.current = L.circleMarker(point, { radius: 10, color: "#ffffff", weight: 3, fillColor: "#ef4444", fillOpacity: 1 }).addTo(map.current);
      marker.current?.setLatLng(point);
      map.current?.panTo(point);
      const data = await meydanApi<ReverseResponse>(`/geo/reverse?latitude=${latitude}&longitude=${longitude}`);
      onSelect({ latitude: data.latitude, longitude: data.longitude, address: data.address, provinceId: data.province_id, cityId: data.city_id, provinceName: data.province_name, cityName: data.city_name });
      setNotice(data.address || "موقعیت انتخاب شد.");
      setStatus("idle");
    } catch {
      setNotice("آدرس این نقطه پیدا نشد؛ نقطه‌ی دیگری را انتخاب کنید.");
      setStatus("error");
    }
  }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      const instance = L.map(element.current, { zoomControl: false }).setView(iranCenter, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(instance);
      L.control.zoom({ position: "topleft" }).addTo(instance);
      map.current = instance;
      instance.on("click", ({ latlng }) => void select(latlng.lat, latlng.lng));
    });
    return () => { disposed = true; map.current?.remove(); map.current = null; marker.current = null; };
  }, [select]);

  const locate = () => {
    if (!navigator.geolocation) { setStatus("error"); setNotice("مرورگر شما موقعیت مکانی را پشتیبانی نمی‌کند."); return; }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(({ coords }) => void select(coords.latitude, coords.longitude), () => { setStatus("error"); setNotice("اجازه‌ی دسترسی به موقعیت داده نشد."); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return <section aria-label="انتخاب موقعیت روی نقشه" className="overflow-hidden rounded-2xl border border-input-border bg-surface-muted"><div className="relative h-72"><div ref={element} className="h-full w-full" /><button type="button" onClick={locate} aria-label="انتخاب موقعیت فعلی" className="absolute bottom-3 left-3 z-[500] grid h-11 w-11 place-items-center rounded-full bg-surface text-foreground shadow-card hover:bg-hover"><Crosshair className="h-5 w-5" /></button></div><div role="status" aria-live="polite" className={`flex min-h-12 items-center gap-2 border-t border-divider px-3 text-xs ${status === "error" ? "text-danger" : "text-foreground-secondary"}`}>{status === "loading" ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <MapPin className="h-4 w-4 shrink-0" />}{notice}</div></section>;
}
