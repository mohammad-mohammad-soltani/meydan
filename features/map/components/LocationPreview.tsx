import { AlertCircle, LoaderCircle, MapPin } from "lucide-react";
import type { City, MapLocation, MapStatus, Province } from "../types";

type LocationPreviewProps = { province: Province; city?: City; location: MapLocation | null; status: MapStatus; error: string | null; };

export function LocationPreview({ province, city, location, status, error }: LocationPreviewProps) {
  return <section className="space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between"><h2 className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white"><MapPin className="h-4 w-4 text-brand-red" />میادین فعال استان <span className="text-brand-red">{province.name}{city ? " · " + city.name : ""}</span></h2><span className="text-[10px] text-slate-500">۱۴ میدان فعال</span></div>{status === "loading" ? <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />در حال دریافت موقعیت…</p> : null}{status === "error" ? <p className="inline-flex items-center gap-1.5 text-[11px] text-red-500"><AlertCircle className="h-3.5 w-3.5" />{error}</p> : null}{location ? <p className="text-[11px] text-slate-500">مختصات: {location.latitude.toFixed(4)}، {location.longitude.toFixed(4)}</p> : null}</section>;
}