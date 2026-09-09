import { AlertCircle, LoaderCircle, MapPin } from "lucide-react";
import type { City, MapLocation, MapStatus, Province } from "../types";

type LocationPreviewProps = { province: Province; city?: City; location: MapLocation | null; status: MapStatus; error: string | null; activeCount: number; };

export function LocationPreview({ province, city, location, status, error, activeCount }: LocationPreviewProps) {
  return (
    <section className="space-y-2 rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground"><MapPin className="h-4 w-4 text-brand" />میادین فعال استان <span className="text-brand">{province.name}{city ? " · " + city.name : ""}</span></h2>
        <span className="text-[10px] text-muted-foreground">{activeCount.toLocaleString("fa-IR")} میدان فعال</span>
      </div>
      {status === "loading" ? <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />در حال دریافت موقعیت…</p> : null}
      {status === "error" ? <p className="inline-flex items-center gap-1.5 text-[11px] text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</p> : null}
      {location ? <p className="text-[11px] text-muted-foreground">مختصات: {location.latitude.toFixed(4)}، {location.longitude.toFixed(4)}</p> : null}
    </section>
  );
}
