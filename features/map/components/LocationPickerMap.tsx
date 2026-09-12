"use client";

import { Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocodeCached } from "../services/map.service";
import type { MapFocusRequest, SelectedLocation } from "../types";

const iranCenter: [number, number] = [35.6892, 51.389];

/**
 * Reverse geocoding is charged per request, so rapid taps are collapsed into a
 * single lookup. The marker still follows the finger immediately.
 */
const geocodeDebounceMs = 450;

function isValidPoint(point?: { latitude: number; longitude: number } | null): point is {
  latitude: number;
  longitude: number;
} {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

export function LocationPickerMap({
  initialLocation,
  fallbackCenter,
  focusRequest,
  onSelect,
  onPendingChange,
  heightClassName = "h-72",
}: {
  initialLocation?: SelectedLocation | null;
  fallbackCenter?: { latitude: number; longitude: number } | null;
  focusRequest?: MapFocusRequest | null;
  onSelect: (location: SelectedLocation) => void;
  onPendingChange?: (pending: boolean) => void;
  heightClassName?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const marker = useRef<import("leaflet").CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPendingChangeRef = useRef(onPendingChange);
  const geocodeTimer = useRef<number | null>(null);
  const initialKey = isValidPoint(initialLocation)
    ? `${initialLocation.latitude},${initialLocation.longitude}`
    : null;
  const appliedInitialKey = useRef<string | null>(null);
  const appliedFocusNonce = useRef<number | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [customNotice, setCustomNotice] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Refs are synced inside effects (not during render) to satisfy react-hooks/refs.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
  }, [onPendingChange]);

  const notice =
    customNotice ??
    (initialLocation?.address ||
      (initialKey ? "موقعیت قبلی شما روی نقشه مشخص است." : null) ||
      (isValidPoint(fallbackCenter)
        ? "موقعیت دقیق ثبت نشده؛ روی نقشه بزنید تا انتخاب شود."
        : "روی نقشه بزنید تا موقعیت شما انتخاب شود."));

  const drawMarker = useCallback(async (latitude: number, longitude: number) => {
    const L = await import("leaflet");
    const point: [number, number] = [latitude, longitude];
    if (!marker.current && map.current) {
      marker.current = L.circleMarker(point, {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: "#ef4444",
        fillOpacity: 1,
      }).addTo(map.current);
    }
    marker.current?.setLatLng(point);
  }, []);

  const resolve = useCallback(async (latitude: number, longitude: number) => {
    setStatus("loading");
    setCustomNotice("در حال تشخیص آدرس، شهر و استان…");
    try {
      const data = await reverseGeocodeCached(latitude, longitude);
      onSelectRef.current({
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        provinceId: data.province_id,
        cityId: data.city_id,
        provinceName: data.province_name,
        cityName: data.city_name,
      });
      setCustomNotice(data.address || "موقعیت انتخاب شد.");
      setStatus("idle");
    } catch {
      setCustomNotice("آدرس این نقطه پیدا نشد؛ نقطه‌ی دیگری را انتخاب کنید.");
      setStatus("error");
    } finally {
      onPendingChangeRef.current?.(false);
    }
  }, []);

  const select = useCallback(
    async (latitude: number, longitude: number) => {
      // The point is committed optimistically so the map feels instant; the
      // caller is told it is pending so it never submits the previous point.
      onPendingChangeRef.current?.(true);
      await drawMarker(latitude, longitude);
      map.current?.panTo([latitude, longitude]);

      if (geocodeTimer.current !== null) window.clearTimeout(geocodeTimer.current);
      geocodeTimer.current = window.setTimeout(() => {
        geocodeTimer.current = null;
        void resolve(latitude, longitude);
      }, geocodeDebounceMs);
    },
    [drawMarker, resolve],
  );
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      const instance = L.map(element.current, { zoomControl: false }).setView(iranCenter, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(instance);
      L.control.zoom({ position: "topleft" }).addTo(instance);
      map.current = instance;
      instance.on("click", ({ latlng }) => void selectRef.current(latlng.lat, latlng.lng));
      setMapReady(true);
    });
    return () => {
      disposed = true;
      if (geocodeTimer.current !== null) {
        window.clearTimeout(geocodeTimer.current);
        geocodeTimer.current = null;
      }
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  // Only manipulates the Leaflet map (external system); the status line text
  // is derived during render, so no setState happens here.
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (initialKey && isValidPoint(initialLocation)) {
      if (appliedInitialKey.current === initialKey) return;
      appliedInitialKey.current = initialKey;
      const { latitude, longitude } = initialLocation;
      void drawMarker(latitude, longitude).then(() => {
        map.current?.setView([latitude, longitude], 14);
      });
      return;
    }
    if (!initialKey && isValidPoint(fallbackCenter)) {
      map.current.setView([fallbackCenter.latitude, fallbackCenter.longitude], 11);
    }
  }, [mapReady, initialKey, initialLocation, fallbackCenter, drawMarker]);

  // Recenter on an explicit request (province/city picked in a dropdown).
  // Keyed on the nonce so an unrelated re-render never moves the map away
  // from a point the user just chose.
  useEffect(() => {
    if (!mapReady || !map.current || !focusRequest) return;
    if (appliedFocusNonce.current === focusRequest.nonce) return;
    appliedFocusNonce.current = focusRequest.nonce;
    map.current.setView([focusRequest.latitude, focusRequest.longitude], focusRequest.zoom);
  }, [mapReady, focusRequest]);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setCustomNotice("مرورگر شما موقعیت مکانی را پشتیبانی نمی‌کند.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void select(coords.latitude, coords.longitude),
      () => {
        setStatus("error");
        setCustomNotice("اجازه‌ی دسترسی به موقعیت داده نشد.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section
      aria-label="انتخاب موقعیت روی نقشه"
      className="overflow-hidden rounded-2xl border border-input-border bg-surface-muted"
    >
      <div className={`relative ${heightClassName}`}>
        <div ref={element} className="h-full w-full" />
        <button
          type="button"
          onClick={locate}
          aria-label="انتخاب موقعیت فعلی"
          className="absolute bottom-3 left-3 z-[500] grid h-11 w-11 place-items-center rounded-full bg-surface text-foreground shadow-card hover:bg-hover"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>
      <div
        role="status"
        aria-live="polite"
        className={`flex min-h-12 items-center gap-2 border-t border-divider px-3 text-xs ${status === "error" ? "text-danger" : "text-foreground-secondary"}`}
      >
        {status === "loading" ? (
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 shrink-0" />
        )}
        {notice}
      </div>
    </section>
  );
}
