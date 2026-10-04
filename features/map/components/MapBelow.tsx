"use client";

import { ChevronDown, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { useState } from "react";
import type { useMap } from "../hooks/useMap";

type MapState = ReturnType<typeof useMap>;
type Square = MapState["resolvedSquares"][number];

const fa = (value: number) => value.toLocaleString("fa-IR");
const PAGE = 24;

/**
 * Below the live map, as in the reference: one «انتخاب استان یا شهر» pill that
 * opens a province → city panel, then the squares of the current area with
 * their coordinates and a «نمایش بیشتر» button.
 */
export function MapBelow({
  map,
  onProvince,
  onCity,
  onAll,
  onSquare,
  onShowMap,
}: {
  map: MapState;
  onProvince: (id: number) => void;
  onCity: (id: number) => void;
  onAll: () => void;
  onSquare: (square: Square) => void;
  onShowMap: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"prov" | "city">("prov");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const needle = query.trim();
  const provinces = [...map.provinceAggregates]
    .filter((item) => item.provinceId)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fa"))
    .filter((item) => !needle || item.name.includes(needle));
  const cities = [...map.cityAggregates]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fa"))
    .filter((item) => !needle || item.name.includes(needle));

  const squares = map.selectedProvince ? map.citySquares : map.resolvedSquares;
  const title = map.selectedCity?.name ?? map.selectedProvince?.name ?? "میادین سراسر کشور";
  const total = map.selectedProvince ? map.citySquares.length : map.activeCount;

  const rowClass = (on: boolean) =>
    `flex w-full items-center gap-2 rounded-[14px] px-3 py-[11px] text-right text-[13.5px] font-semibold transition-colors ${on ? "bg-brand text-white" : "text-foreground hover:bg-surface-muted"}`;
  const countClass = (on: boolean) => `text-[11px] font-extrabold ${on ? "text-white/90" : "text-brand"}`;

  return (
    <div className="flex flex-col gap-2.5 px-3.5 pt-3.5 lg:px-[22px] lg:pt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); setStep(map.selectedProvince ? "city" : "prov"); setQuery(""); }}
        className="flex h-[52px] w-full items-center gap-2.5 rounded-[18px] border border-border bg-surface-muted px-4 text-right text-foreground transition active:scale-[.99]"
      >
        <MapPin aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[13.5px]">
          {map.selectedProvince ? (
            <>
              <b className="font-extrabold">{map.selectedProvince.name}</b>
              {map.selectedCity ? <><i className="mx-[3px] not-italic text-muted-foreground">›</i>{map.selectedCity.name}</> : null}
            </>
          ) : (
            <b className="font-extrabold">انتخاب استان یا شهر</b>
          )}
        </span>
        <em className="text-[11.5px] not-italic text-muted-foreground">{fa(total)} میدان</em>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="overflow-hidden rounded-[22px] border border-border bg-background">
          <label className="m-2.5 flex h-[42px] items-center gap-2 rounded-full bg-surface-muted px-3.5 text-muted-foreground">
            <Search aria-hidden="true" className="h-4 w-4" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={step === "prov" ? "جستجوی استان یا شهر…" : "جستجوی شهر…"}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none"
            />
          </label>
          <div className="max-h-[min(52vh,420px)] overflow-y-auto px-2 pb-2.5">
            {step === "prov" ? (
              <>
                {!needle ? (
                  <button type="button" onClick={() => { onAll(); setOpen(false); }} className={rowClass(!map.selectedProvince)}>
                    <span className="flex-1">همهٔ ایران</span>
                    <em className={`not-italic ${countClass(!map.selectedProvince)}`}>{fa(map.activeCount)} میدان</em>
                  </button>
                ) : null}
                {provinces.map((province) => {
                  const on = map.selectedProvinceId === province.provinceId;
                  return (
                    <button key={province.id} type="button" onClick={() => { onProvince(province.provinceId!); setStep("city"); setQuery(""); }} className={rowClass(on)}>
                      <span className="flex-1">{province.name}</span>
                      <em className={`not-italic ${countClass(on)}`}>{fa(province.count)} میدان</em>
                      <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0 opacity-75" />
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 px-1 pb-1.5">
                  <button type="button" onClick={() => { setStep("prov"); setQuery(""); }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-surface-muted">
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    بازگشت
                  </button>
                  <b className="text-sm font-extrabold">{map.selectedProvince?.name}</b>
                </div>
                {!needle && map.selectedProvinceId ? (
                  <button type="button" onClick={() => { onProvince(map.selectedProvinceId); setOpen(false); }} className={rowClass(!map.selectedCity)}>
                    <span className="flex-1">همهٔ استان</span>
                    <em className={`not-italic ${countClass(!map.selectedCity)}`}>{fa(map.cityAggregates.reduce((sum, city) => sum + city.count, 0))} میدان</em>
                  </button>
                ) : null}
                {cities.map((city) => {
                  const on = map.selectedCityId === city.cityId;
                  return (
                    <button key={city.id} type="button" onClick={() => { if (city.cityId) onCity(city.cityId); setOpen(false); }} className={rowClass(on)}>
                      <span className="flex-1">{city.name}</span>
                      <em className={`not-italic ${countClass(on)}`}>{fa(city.count)} میدان</em>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2.5 px-1 pt-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[15px] font-black text-foreground">{title}</h1>
          <span className="text-[11.5px] text-muted-foreground">{fa(total)} میدان فعال</span>
        </div>
        <button type="button" onClick={onShowMap} className="shrink-0 rounded-full border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-surface-muted">
          مشاهده روی نقشه
        </button>
      </div>

      <div className="flex flex-col pb-6">
        {squares.slice(0, shown).map((square) => (
          <button
            key={square.id}
            type="button"
            onClick={() => onSquare(square)}
            className="flex items-center gap-3 border-b border-border px-1 py-[15px] text-right text-foreground transition-colors hover:bg-surface-muted"
          >
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-foreground" />
            <b className="flex-1 text-[13.5px] font-bold leading-[1.7]">{square.name}</b>
            <small dir="ltr" className="shrink-0 text-[11px] text-muted-foreground">{square.latitude.toFixed(4)}, {square.longitude.toFixed(4)}</small>
          </button>
        ))}
        {squares.length > shown ? (
          <button type="button" onClick={() => setShown((value) => value + PAGE)} className="mx-auto mt-3 rounded-full border border-border px-[22px] py-2.5 text-[12.5px] font-bold text-foreground">
            نمایش بیشتر ({fa(squares.length - shown)})
          </button>
        ) : null}
      </div>
    </div>
  );
}
