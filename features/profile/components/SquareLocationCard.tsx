"use client";

import { MapPin, Navigation } from "lucide-react";
import type { ProfileDetails } from "../types";

function isValidPoint(value: { latitude?: number; longitude?: number }): value is {
  latitude: number;
  longitude: number;
} {
  return (
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude as number) <= 90 &&
    Math.abs(value.longitude as number) <= 180
  );
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function SquareLocationCard({ profile }: { profile: ProfileDetails }) {
  const address = (profile.identity.location || "").trim();
  const point = { latitude: profile.latitude, longitude: profile.longitude };
  const hasPoint = isValidPoint(point);

  if (!hasPoint && !address) return null;

  const locationText =
    address ||
    (hasPoint
      ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
      : "");

  /*
   * On a phone the platform map app owns navigation: Android answers `geo:`
   * and iOS answers `maps://`. Everywhere else the in-site live map opens,
   * focused on this square when its coordinates are known.
   */
  const openDirections = () => {
    if (typeof window === "undefined") return;

    if (isMobileDevice()) {
      const label = encodeURIComponent(profile.identity.name);

      if (hasPoint) {
        if (isIosDevice()) {
          window.location.href = `maps://?daddr=${point.latitude},${point.longitude}&q=${label}`;
        } else {
          window.location.href = `geo:${point.latitude},${point.longitude}?q=${point.latitude},${point.longitude}(${label})`;
        }
        return;
      }

      if (isIosDevice()) {
        window.location.href = `maps://?q=${encodeURIComponent(address)}`;
      } else {
        window.location.href = `geo:0,0?q=${encodeURIComponent(address)}`;
      }
      return;
    }

    const destination = hasPoint ? `${point.latitude},${point.longitude}` : address;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      aria-label="موقعیت میدان"
      className="border-b border-divider px-4 py-5"
    >
      <h2 className="inline-flex items-center gap-1.5 text-sm font-black text-foreground">
        <MapPin aria-hidden="true" className="h-4 w-4 text-brand" />
        موقعیت میدان
      </h2>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] leading-7 text-foreground-secondary">
          {locationText}
        </p>

        <button
          type="button"
          onClick={openDirections}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-4 text-xs font-black text-brand-foreground outline-none transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          مسیریابی
        </button>
      </div>
    </section>
  );
}
