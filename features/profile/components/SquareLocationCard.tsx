import Link from "next/link";
import type { Route } from "next";
import { MapPin } from "lucide-react";
import { MapFrame } from "@/features/map/components/MapFrame";
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

export function SquareLocationCard({ profile }: { profile: ProfileDetails }) {
  const address = profile.identity.location;
  const point = { latitude: profile.latitude, longitude: profile.longitude };
  const hasPoint = isValidPoint(point);

  if (!hasPoint && !address) return null;

  return (
    <section aria-label="موقعیت میدان" className="border-b border-divider px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-black text-foreground">
          <MapPin aria-hidden="true" className="h-4 w-4 text-brand" />
          موقعیت میدان
        </h2>
        <Link
          href={"/map" as Route}
          className="text-[11px] font-bold text-brand hover:underline"
        >
          مشاهده در نقشه زنده
        </Link>
      </div>
      {address ? (
        <p className="mt-2 text-xs leading-6 text-foreground-secondary">{address}</p>
      ) : null}
      {hasPoint ? (
        <div className="relative isolate z-0 mt-3 overflow-hidden rounded-card">
          <MapFrame
            selectedSquares={[
              { id: "current", name: profile.identity.name, latitude: point.latitude, longitude: point.longitude },
            ]}
            aggregates={[]}
            center={{ latitude: point.latitude, longitude: point.longitude }}
            onSelectProvince={() => undefined}
          />
        </div>
      ) : (
        <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
          موقعیت دقیق روی نقشه ثبت نشده است.
        </p>
      )}
    </section>
  );
}
