"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CircleDot, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { AdminEmptyState, AdminErrorState } from "./AdminStateViews";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminNotice } from "./AdminNotice";
import { fa, secondaryButtonClass } from "./styles";
import { addOpenFreeMapBasemap } from "@/features/map/services/openfreemap-basemap";
import { LIVE_MAP_THEME } from "@/features/map/map-theme";
import { adminErrorMessage, getSquareMap } from "../services/squares.service";
import { SQUARE_STATUS_LABELS, type SquareMapPoint, type SquareStatus } from "../types";

const IRAN_CENTER: [number, number] = [32.4279, 53.688];
const INITIAL_ZOOM = 5;

/**
 * Marker colour per approval status. Only three tones are needed; `verified`
 * upgrades an approved square to the brand colour.
 */
const MARKER_COLORS: Record<SquareStatus, string> = {
  pending_verification: "#d97706",
  approved: "#16a34a",
  rejected: "#dc2626",
  suspended: "#6b7280",
};

/** Escapes text before it goes into a Leaflet popup's HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markerColor(point: SquareMapPoint): string {
  if (point.approvalStatus === "approved" && point.verified) return LIVE_MAP_THEME.pin;
  return MARKER_COLORS[point.approvalStatus] ?? MARKER_COLORS.pending_verification;
}

/**
 * The admin map.
 *
 * It reuses the project's localised OpenFreeMap basemap helper — `react-leaflet`
 * and the clustering plugin are deliberately absent from the project — and
 * aggregates in the client instead of adding a plugin: identical coordinates
 * collapse into one count-pin.
 *
 * `GET /admin/squares/map` inner-joins the geo table, so a square without a
 * geo row is simply not in the response. The empty state says that out loud.
 */
export function AdminSquareMapView({ initialPoints }: { initialPoints: SquareMapPoint[] }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layers = useRef<import("leaflet").Layer[]>([]);
  const [points, setPoints] = useState<SquareMapPoint[]>(initialPoints);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SquareStatus | "">("");

  const visible = useMemo(
    () => (statusFilter ? points.filter((point) => point.approvalStatus === statusFilter) : points),
    [points, statusFilter],
  );

  /** Same-coordinate squares collapse into one pin carrying a count. */
  const clusters = useMemo(() => {
    const groups = new Map<string, { latitude: number; longitude: number; items: SquareMapPoint[] }>();
    for (const point of visible) {
      const key = `${point.location.latitude.toFixed(5)},${point.location.longitude.toFixed(5)}`;
      const existing = groups.get(key);
      if (existing) existing.items.push(point);
      else
        groups.set(key, {
          latitude: point.location.latitude,
          longitude: point.location.longitude,
          items: [point],
        });
    }
    return [...groups.values()];
  }, [visible]);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then(async (L) => {
      if (disposed || !element.current) return;

      const instance = L.map(element.current, {
        zoomControl: true,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 18,
      }).setView(IRAN_CENTER, INITIAL_ZOOM);

      map.current = instance;

      try {
        await addOpenFreeMapBasemap(L, instance);
      } catch (basemapError) {
        console.error("Unable to load OpenFreeMap basemap", basemapError);
      }

      if (disposed || !map.current) return;
      setReady(true);
    });

    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      layers.current = [];
    };
  }, []);

  useEffect(() => {
    if (!ready || !map.current) return;
    let disposed = false;

    void import("leaflet").then((L) => {
      if (disposed || !map.current) return;

      for (const layer of layers.current) layer.remove();
      layers.current = [];

      const bounds: Array<[number, number]> = [];
      for (const cluster of clusters) {
        const color = markerColor(cluster.items[0]);
        const count = cluster.items.length;

        const marker = L.circleMarker([cluster.latitude, cluster.longitude], {
          radius: count > 1 ? 12 : 7,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        }).addTo(map.current!);

        const list = cluster.items
          .map(
            (item) =>
              `<li style="margin:2px 0"><a href="/admin/squares/${item.id}" style="color:inherit;font-weight:700">${escapeHtml(
                item.name || `میدان #${item.id}`,
              )}</a> <span style="opacity:.7">· ${escapeHtml(
                SQUARE_STATUS_LABELS[item.approvalStatus] ?? item.approvalStatus,
              )}</span></li>`,
          )
          .join("");

        marker.bindPopup(
          `<div style="min-width:180px;font-size:12px" dir="rtl">
             <strong style="display:block;margin-bottom:4px">${
               count > 1 ? `${count} میدان در این نقطه` : escapeHtml(cluster.items[0].name)
             }</strong>
             <ul style="margin:0;padding-inline-start:14px">${list}</ul>
           </div>`,
        );

        if (count > 1) {
          marker.bindTooltip(String(count), {
            permanent: true,
            direction: "center",
            className: "meydan-cluster-count",
          });
        }

        layers.current.push(marker);
        bounds.push([cluster.latitude, cluster.longitude]);
      }

      if (bounds.length > 0) {
        map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
    });

    return () => {
      disposed = true;
    };
  }, [clusters, ready]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setPoints(await getSquareMap());
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت موقعیت میادین ممکن نشد."));
    } finally {
      setLoading(false);
    }
  };

  const withoutGeoNotice =
    points.length === 0
      ? "هیچ میدانی رکورد جغرافیایی ندارد؛ میدان‌های بدون موقعیت روی این نقشه نمی‌آیند."
      : null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="نقشه میادین"
        description="رنگ هر نشان بر اساس وضعیت تأیید است؛ نقطه‌های هم‌مکان در یک نشان با شمارش جمع می‌شوند."
        crumbs={[{ label: "میادین", href: "/admin/squares" }, { label: "نقشه" }]}
        actions={
          <button type="button" onClick={() => void reload()} disabled={loading} className={secondaryButtonClass}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            بازخوانی
          </button>
        }
      />

      <div className="border-b border-divider bg-surface px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={statusFilter === ""}
            onClick={() => setStatusFilter("")}
            className={`inline-flex min-h-8 items-center rounded-pill border px-2.5 text-[10px] font-black transition-colors ${
              statusFilter === "" ? "border-brand-border bg-selected text-selected-foreground" : "border-border bg-surface text-muted-foreground hover:bg-hover"
            }`}
          >
            همه ({fa(points.length)})
          </button>
          {(Object.keys(SQUARE_STATUS_LABELS) as SquareStatus[]).map((status) => {
            const count = points.filter((point) => point.approvalStatus === status).length;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-pill border px-2.5 text-[10px] font-black transition-colors ${
                  statusFilter === status ? "border-brand-border bg-selected text-selected-foreground" : "border-border bg-surface text-muted-foreground hover:bg-hover"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ background: MARKER_COLORS[status] }}
                />
                {SQUARE_STATUS_LABELS[status]} ({fa(count)})
              </button>
            );
          })}
        </div>
      </div>

      {withoutGeoNotice ? (
        <AdminNotice tone="info" message={withoutGeoNotice} className="m-3" />
      ) : null}

      {error ? (
        <AdminErrorState message={error} onRetry={() => void reload()} retrying={loading} />
      ) : (
        <div className="p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-card border border-border bg-[#171a1b]">
            <div ref={element} className="h-[60vh] min-h-[380px] w-full" />
            {!ready ? (
              <div className="absolute inset-0 grid place-items-center bg-black/30">
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-[#2a2b2c]/90 px-4 py-2 text-xs font-bold text-white">
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-[#e5544b]" />
                  در حال آماده‌سازی نقشه…
                </span>
              </div>
            ) : null}
            {ready && visible.length === 0 ? (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-control border border-border bg-surface-glass px-3 py-2 text-[11px] text-foreground-secondary backdrop-blur">
                <MapPin aria-hidden="true" className="me-1 inline h-3.5 w-3.5" />
                میدانی با این فیلتر روی نقشه نیست.
              </div>
            ) : null}
          </div>

          {visible.length > 0 ? (
            <ul className="mt-3 divide-y divide-divider rounded-card border border-border bg-surface">
              {visible.slice(0, 30).map((point) => (
                <li key={point.id} className="flex items-center gap-3 px-3 py-2.5">
                  <CircleDot
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                    style={{ color: markerColor(point) }}
                  />
                  <Link
                    href={`/admin/squares/${point.id}` as Route}
                    className="min-w-0 flex-1 truncate text-xs font-bold text-foreground hover:text-brand"
                  >
                    {point.name || `میدان #${point.id}`}
                  </Link>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {SQUARE_STATUS_LABELS[point.approvalStatus]}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {visible.length > 30 ? (
            <p className="mt-2 text-[10px] text-muted-foreground">
              {fa(visible.length - 30)} میدان دیگر روی نقشه هست؛ برای دیدن همه، فیلتر وضعیت را باریک‌تر کنید.
            </p>
          ) : null}

          {points.length === 0 && !error ? (
            <AdminEmptyState
              title="نقطه‌ای برای نمایش نیست"
              description="این endpoint فقط میدان‌هایی را برمی‌گرداند که رکورد جغرافیایی دارند. برای افزودن موقعیت، میدان را باز کنید و بخش «موقعیت» را ذخیره کنید."
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
