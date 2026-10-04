"use client";

import styles from "../reference.module.css";
import "./map-svg.css";

import Link from "next/link";
import type { Route } from "next";
import { Minus, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IRAN_ISLANDS } from "../data/iran-islands";
import { normalizePlace, type ResolvedSquare } from "../geo/aggregation";
import type { CountAggregate } from "../hooks/useMap";

type Poly = number[][];
type Province = { fa: string; paths: Poly[]; c: [number, number]; b: [number, number, number, number] };
type Land = { fa?: string; paths: Poly[]; c: [number, number] };
type MapData = { provs: Province[]; water: Poly[]; land: Land[] };

type Card = { title: string; sub: string; coords: string; href?: string };
type View = { tx: number; ty: number; s: number };
type Selection = { p: number | null; c: string | null; isl: number | null };

export type MapFocus = { latitude: number; longitude: number; nonce: number };

const NS = "http://www.w3.org/2000/svg";
const COS = Math.cos((32.5 * Math.PI) / 180);
const K = 100;
const IRAN_BOX: [number, number, number, number] = [43.9, 23.7, 63.6, 39.9];
const SEAS: Array<[string, number, number]> = [
  ["دریای خزر", 51.7, 38.75],
  ["خلیج فارس", 51.4, 27.3],
  ["دریای عمان", 58.4, 24.45],
];
const fa = (value: number) => value.toLocaleString("fa-IR");
const wx = (lon: number) => lon * COS * K;
const wy = (lat: number) => -lat * K;
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function pathD(poly: Poly): string {
  let d = "";
  for (let i = 0; i < poly.length; i++) d += `${i ? "L" : "M"}${wx(poly[i][0]).toFixed(1)} ${wy(poly[i][1]).toFixed(1)}`;
  return `${d}Z`;
}

function boundsOfPoints(points: Array<{ latitude: number; longitude: number }>, pad: number): [number, number, number, number] {
  const box: [number, number, number, number] = [1e9, 1e9, -1e9, -1e9];
  for (const point of points) {
    box[0] = Math.min(box[0], point.longitude);
    box[1] = Math.min(box[1], point.latitude);
    box[2] = Math.max(box[2], point.longitude);
    box[3] = Math.max(box[3], point.latitude);
  }
  return [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
}

/** Everything the engine needs from React, kept current without recreating the engine. */
type Inputs = {
  squares: ResolvedSquare[];
  onProvinceName: (name: string) => boolean;
  showCard: (card: Card | null) => void;
};

/**
 * The reference's map engine: provinces, sea and neighbours as SVG paths, drag / pinch / wheel
 * zoom, pixel-grid clustering, province highlight and animated flights. React renders only the
 * chrome around it; the drawing itself is written straight to the SVG for smooth gestures.
 */
function createEngine(svg: SVGSVGElement, data: MapData, inputs: { current: Inputs }) {
  const provinces = data.provs;
  const index = new Map<string, number>();
  provinces.forEach((province, i) => index.set(normalizePlace(province.fa), i));

  const layer = (name: string) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", name);
    svg.appendChild(g);
    return g;
  };
  const gWater = layer("g-w");
  const gLand = layer("g-b");
  const gProv = layer("g-p");
  const gLabels = layer("g-l");
  const gMarks = layer("g-m");

  const provEls = provinces.map((province, i) => {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", province.paths.map(pathD).join(""));
    el.setAttribute("class", "pv");
    el.dataset.i = String(i);
    gProv.appendChild(el);
    return el;
  });
  data.water.forEach((poly) => {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", pathD(poly));
    el.setAttribute("class", "wt");
    gWater.appendChild(el);
  });
  data.land.forEach((land) => {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", land.paths.map(pathD).join(""));
    el.setAttribute("class", "ld");
    gLand.appendChild(el);
  });
  const text = (cls: string, value: string) => {
    const el = document.createElementNS(NS, "text");
    el.setAttribute("class", cls);
    el.textContent = value;
    gLabels.appendChild(el);
    return el;
  };
  const named = data.land.filter((land) => land.fa);
  const nameEls = named.map((land) => text("nl", land.fa as string));
  const labelEls = provinces.map((province) => text("pl", province.fa));
  const seaEls = SEAS.map((sea) => text("sea", sea[0]));

  let W = 300;
  let H = 300;
  let sMin = 1;
  let sMax = 100;
  const v: View = { tx: 0, ty: 0, s: 1 };
  let sel: Selection = { p: null, c: null, isl: null };
  let selSq: ResolvedSquare | null = null;
  let squares: ResolvedSquare[] = [];
  let provOf = new Map<string, number>();
  let cells: Record<string, { n: number; items: ResolvedSquare[] }> = {};
  let anim = 0;

  const size = () => {
    const box = svg.getBoundingClientRect();
    W = box.width || 300;
    H = box.height || 300;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  };
  const boundsOf = (b: number[], pad = 28): View => {
    const x0 = wx(b[0]);
    const x1 = wx(b[2]);
    const y0 = wy(b[3]);
    const y1 = wy(b[1]);
    const s = Math.min((W - pad * 2) / Math.max(x1 - x0, 1), (H - pad * 2 - 40) / Math.max(y1 - y0, 1));
    return { s, tx: W / 2 - ((x0 + x1) / 2) * s, ty: (H + 40) / 2 - ((y0 + y1) / 2) * s };
  };
  const fitIran = () => boundsOf(IRAN_BOX, 10);

  const inScope = (q: ResolvedSquare) => {
    if (sel.p == null) return true;
    if (provOf.get(q.id) !== sel.p) return false;
    return sel.c == null || normalizePlace(q.displayCityName) === normalizePlace(sel.c);
  };

  function drawMarkers() {
    cells = {};
    const cell = 44;
    for (const q of squares) {
      const x = wx(q.longitude) * v.s + v.tx;
      const y = wy(q.latitude) * v.s + v.ty;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      const key = `${Math.floor(x / cell)}_${Math.floor(y / cell)}`;
      const c = (cells[key] ??= { n: 0, items: [] });
      c.n++;
      c.items.push(q);
    }
    let html = "";
    for (const [key, c] of Object.entries(cells)) {
      let sx = 0;
      let sy = 0;
      for (const q of c.items) {
        sx += wx(q.longitude) * v.s + v.tx;
        sy += wy(q.latitude) * v.s + v.ty;
      }
      const x = sx / c.n;
      const y = sy / c.n;
      const dim = sel.p != null && !c.items.some(inScope) ? " dim" : "";
      if (c.n > 1) {
        html += `<g class="mk cl${dim}" data-k="${key}" transform="translate(${x} ${y})"><circle r="${13 + Math.min(8, Math.log(c.n) * 3)}"/><text dy=".35em">${fa(c.n)}</text></g>`;
      } else {
        const q = c.items[0];
        const on = selSq?.id === q.id;
        html += `<g class="mk sg${on ? " on" : ""}${dim}" data-id="${escapeHtml(q.id)}" transform="translate(${x} ${y})">${on ? '<circle class="ring" r="14"/>' : ""}<circle r="${on ? 8 : 6}"/></g>`;
      }
    }
    IRAN_ISLANDS.forEach((island, i) => {
      const x = wx(island.longitude) * v.s + v.tx;
      const y = wy(island.latitude) * v.s + v.ty;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
      const on = sel.isl === i;
      const big = on || v.s / sMin > 2.6;
      html += `<g class="mk is${on ? " on" : ""}" data-isl="${i}" transform="translate(${x} ${y})"><circle class="hit" r="14"/><circle class="o" r="${on ? 7 : 5}"/>${on ? '<circle class="ring" r="14"/>' : ""}${big ? `<text y="-12">${escapeHtml(island.name)}</text>` : ""}</g>`;
    });
    gMarks.innerHTML = html;
  }

  function apply() {
    const tf = `translate(${v.tx} ${v.ty}) scale(${v.s})`;
    gProv.setAttribute("transform", tf);
    gWater.setAttribute("transform", tf);
    gLand.setAttribute("transform", tf);
    const scale = v.s / (sMin || 1);
    provinces.forEach((province, i) => {
      const x = wx(province.c[0]) * v.s + v.tx;
      const y = wy(province.c[1]) * v.s + v.ty;
      const box = (province.b[2] - province.b[0]) * COS * K * v.s;
      const show = scale > 0.9 && box > (sel.p === i ? 0 : 52) && x > -20 && x < W + 20 && y > 0 && y < H;
      const el = labelEls[i];
      el.style.display = show ? "" : "none";
      if (show) {
        el.setAttribute("x", String(x));
        el.setAttribute("y", String(y));
        el.style.opacity = sel.p == null || sel.p === i ? "1" : ".4";
      }
    });
    named.forEach((land, i) => {
      const x = wx(land.c[0]) * v.s + v.tx;
      const y = wy(land.c[1]) * v.s + v.ty;
      const ok = scale > 0.9 && scale < 9 && x > -40 && x < W + 40 && y > 0 && y < H;
      const el = nameEls[i];
      el.style.display = ok ? "" : "none";
      if (ok) {
        el.setAttribute("x", String(x));
        el.setAttribute("y", String(y));
      }
    });
    SEAS.forEach((sea, i) => {
      const x = wx(sea[1]) * v.s + v.tx;
      const y = wy(sea[2]) * v.s + v.ty;
      const el = seaEls[i];
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(y));
      el.style.display = scale > 0.9 && scale < 14 && x > -60 && x < W + 60 && y > 0 && y < H ? "" : "none";
    });
    drawMarkers();
  }

  function go(target: View, ms = 520) {
    cancelAnimationFrame(anim);
    const from = { ...v };
    const t0 = performance.now();
    const step = (now: number) => {
      const u0 = Math.min(1, (now - t0) / ms);
      const u = 1 - Math.pow(1 - u0, 3);
      v.s = from.s * Math.pow(target.s / from.s, u);
      const cx0 = (W / 2 - from.tx) / from.s;
      const cy0 = (H / 2 - from.ty) / from.s;
      const cx1 = (W / 2 - target.tx) / target.s;
      const cy1 = (H / 2 - target.ty) / target.s;
      v.tx = W / 2 - (cx0 + (cx1 - cx0) * u) * v.s;
      v.ty = H / 2 - (cy0 + (cy1 - cy0) * u) * v.s;
      apply();
      if (u0 < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  const zoomAt = (px: number, py: number, k: number) => {
    const next = Math.max(sMin * 0.8, Math.min(sMax, v.s * k));
    const f = next / v.s;
    v.tx = px - (px - v.tx) * f;
    v.ty = py - (py - v.ty) * f;
    v.s = next;
  };

  const squareCard = (q: ResolvedSquare): Card => ({
    title: q.name,
    sub: [q.displayProvinceName, q.displayCityName].filter(Boolean).join(" · "),
    coords: `${q.latitude.toFixed(4)}, ${q.longitude.toFixed(4)}`,
    href: q.handle ? `/${q.handle}` : undefined,
  });

  function pickSquare(q: ResolvedSquare, fly = true) {
    selSq = q;
    sel = { ...sel, isl: null };
    if (fly) {
      const pad = 0.035;
      go(boundsOf([q.longitude - pad, q.latitude - pad, q.longitude + pad, q.latitude + pad], 60), 600);
    }
    inputs.current.showCard(squareCard(q));
    drawMarkers();
  }
  function pickIsland(i: number, fly = true) {
    const island = IRAN_ISLANDS[i];
    selSq = null;
    sel = { ...sel, isl: i };
    if (fly) {
      const pad = 0.28;
      go(boundsOf([island.longitude - pad, island.latitude - pad, island.longitude + pad, island.latitude + pad], 70), 650);
    }
    inputs.current.showCard({
      title: `جزیرهٔ ${island.name}`,
      sub: island.province,
      coords: `${island.latitude.toFixed(4)}, ${island.longitude.toFixed(4)}`,
    });
    drawMarkers();
  }
  function closeCard() {
    selSq = null;
    sel = { ...sel, isl: null };
    inputs.current.showCard(null);
    drawMarkers();
  }

  // ---- gestures ----
  const pointers = new Map<number, { x: number; y: number }>();
  let moved = 0;
  const onDown = (e: PointerEvent) => {
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = 0;
    cancelAnimationFrame(anim);
  };
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const box = svg.getBoundingClientRect();
    if (pointers.size === 1) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      moved += Math.abs(dx) + Math.abs(dy);
      v.tx += dx;
      v.ty += dy;
      p.x = e.clientX;
      p.y = e.clientY;
      apply();
    } else if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
      if (!other) return;
      const before = Math.hypot(p.x - other.x, p.y - other.y);
      p.x = e.clientX;
      p.y = e.clientY;
      const after = Math.hypot(p.x - other.x, p.y - other.y);
      moved += 10;
      if (before > 0) zoomAt((p.x + other.x) / 2 - box.left, (p.y + other.y) / 2 - box.top, after / before);
      apply();
    }
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const box = svg.getBoundingClientRect();
    zoomAt(e.clientX - box.left, e.clientY - box.top, Math.exp(-e.deltaY * 0.0018));
    apply();
  };
  const onDouble = (e: MouseEvent) => {
    const box = svg.getBoundingClientRect();
    zoomAt(e.clientX - box.left, e.clientY - box.top, 1.8);
    apply();
  };
  const onClick = (e: MouseEvent) => {
    if (moved > 6) return;
    const target = (document.elementFromPoint(e.clientX, e.clientY) as Element | null) ?? (e.target as Element);
    const mark = target.closest?.(".mk") as SVGGElement | null;
    if (mark) {
      if (mark.classList.contains("is")) {
        pickIsland(Number(mark.dataset.isl));
        return;
      }
      if (mark.classList.contains("cl")) {
        const items = cells[mark.dataset.k ?? ""]?.items ?? [];
        if (items.length) go(boundsOf(boundsOfPoints(items, 0.02), 50));
        return;
      }
      const q = squares.find((item) => item.id === mark.dataset.id);
      if (q) pickSquare(q);
      return;
    }
    if (target.classList?.contains("pv")) {
      const i = Number((target as SVGPathElement).dataset.i);
      if (!inputs.current.onProvinceName(provinces[i].fa)) {
        // A province without squares cannot be chosen in the list below; just look at it.
        setSelection(provinces[i].fa, null);
      }
      return;
    }
    closeCard();
  };
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("dblclick", onDouble);
  svg.addEventListener("click", onClick);

  // ---- state coming from React ----
  function setSquares(list: ResolvedSquare[]) {
    squares = list;
    provOf = new Map();
    for (const q of list) {
      const i = index.get(normalizePlace(q.displayProvinceName ?? q.provinceName));
      if (i != null) provOf.set(q.id, i);
    }
    if (selSq && !list.some((item) => item.id === selSq?.id)) selSq = null;
    drawMarkers();
  }
  function setSelection(provinceName: string | null, cityName: string | null, fly = true) {
    const p = provinceName ? (index.get(normalizePlace(provinceName)) ?? null) : null;
    const unchanged = p === sel.p && (cityName ?? null) === sel.c;
    sel = { p, c: cityName, isl: null };
    selSq = null;
    inputs.current.showCard(null);
    provEls.forEach((el, i) => el.classList.toggle("sel", p === i));
    if (!unchanged && fly) {
      if (p == null) go(fitIran());
      else if (cityName) {
        const items = squares.filter(inScope);
        if (items.length) go(boundsOf(boundsOfPoints(items, items.length === 1 ? 0.12 : 0.04), 44));
        else go(boundsOf(provinces[p].b, 26));
      } else go(boundsOf(provinces[p].b, 26));
    }
    apply();
  }
  function focusPoint(latitude: number, longitude: number) {
    const q = squares.find((item) => Math.abs(item.latitude - latitude) < 1e-5 && Math.abs(item.longitude - longitude) < 1e-5);
    if (q) pickSquare(q);
    else {
      const pad = 0.035;
      go(boundsOf([longitude - pad, latitude - pad, longitude + pad, latitude + pad], 60), 600);
    }
  }
  function zoom(k: number) {
    const next = Math.max(sMin * 0.8, Math.min(sMax, v.s * k));
    const f = next / v.s;
    go({ s: next, tx: W / 2 - (W / 2 - v.tx) * f, ty: H / 2 - (H / 2 - v.ty) * f }, 260);
  }
  function fit() {
    sel = { p: null, c: null, isl: null };
    provEls.forEach((el) => el.classList.remove("sel"));
    closeCard();
    go(fitIran());
  }
  function resize() {
    const oldW = W;
    size();
    if (Math.abs(W - oldW) > 1) {
      const f = fitIran();
      sMin = f.s;
      sMax = f.s * 400;
      if (sel.p == null) Object.assign(v, f);
      apply();
    }
  }
  function init() {
    size();
    const f = fitIran();
    sMin = f.s;
    sMax = f.s * 400;
    Object.assign(v, f);
    apply();
  }

  return {
    setSquares,
    setSelection,
    focusPoint,
    pickSquare,
    pickIsland,
    zoom,
    fit,
    resize,
    init,
    destroy() {
      cancelAnimationFrame(anim);
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onUp);
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("dblclick", onDouble);
      svg.removeEventListener("click", onClick);
      svg.replaceChildren();
    },
  };
}

type Engine = ReturnType<typeof createEngine>;

export function MapSvg({
  squares,
  provinces,
  cities,
  selectedProvinceName,
  selectedCityName,
  focus,
  onSelectProvince,
  onSelectCity,
}: {
  squares: ResolvedSquare[];
  provinces: CountAggregate[];
  cities: CountAggregate[];
  selectedProvinceName: string | null;
  selectedCityName: string | null;
  focus: MapFocus | null;
  onSelectProvince: (id: number) => void;
  onSelectCity: (id: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [data, setData] = useState<MapData | null>(null);
  const [failed, setFailed] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const provinceRef = useRef(provinces);
  provinceRef.current = provinces;
  const onProvinceRef = useRef(onSelectProvince);
  onProvinceRef.current = onSelectProvince;
  const inputs = useRef<Inputs>({
    squares,
    showCard: setCard,
    onProvinceName: (name) => {
      const wanted = normalizePlace(name);
      const found = provinceRef.current.find((item) => item.provinceId && normalizePlace(item.name) === wanted);
      if (!found?.provinceId) return false;
      onProvinceRef.current(found.provinceId);
      return true;
    },
  });
  inputs.current.squares = squares;

  useEffect(() => {
    let active = true;
    fetch("/maps/iran-svg-map.json")
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<MapData>;
      })
      .then((json) => active && setData(json))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const host = hostRef.current;
    if (!svg || !host || !data) return;
    const engine = createEngine(svg, data, inputs);
    engineRef.current = engine;
    engine.setSquares(squares);
    const frame = requestAnimationFrame(() => {
      engine.init();
      engine.setSelection(selectedProvinceName, selectedCityName, false);
    });
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // The engine is built once per data load; the effects below feed it the changing inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    engineRef.current?.setSquares(squares);
  }, [squares]);
  useEffect(() => {
    engineRef.current?.setSelection(selectedProvinceName, selectedCityName);
  }, [selectedProvinceName, selectedCityName]);
  useEffect(() => {
    if (focus) engineRef.current?.focusPoint(focus.latitude, focus.longitude);
  }, [focus]);

  const needle = normalizePlace(query);
  const results = useMemo(() => {
    if (!needle) return [];
    const out: Array<{ key: string; title: string; sub: string; run: () => void }> = [];
    for (const q of squares) {
      if (out.length >= 12) break;
      const hay = normalizePlace(`${q.name} ${q.displayProvinceName ?? ""} ${q.displayCityName ?? ""}`);
      if (hay.includes(needle)) out.push({ key: `s${q.id}`, title: q.name, sub: [q.displayProvinceName, q.displayCityName].filter(Boolean).join(" · "), run: () => engineRef.current?.pickSquare(q) });
    }
    for (const p of provinces) {
      if (out.length >= 12) break;
      if (p.provinceId && normalizePlace(p.name).includes(needle)) out.push({ key: `p${p.provinceId}`, title: p.name, sub: `${fa(p.count)} میدان`, run: () => onSelectProvince(p.provinceId as number) });
    }
    for (const c of cities) {
      if (out.length >= 12) break;
      if (c.cityId && normalizePlace(c.name).includes(needle)) out.push({ key: `c${c.cityId}`, title: c.name, sub: `${fa(c.count)} میدان`, run: () => onSelectCity(c.cityId as number) });
    }
    IRAN_ISLANDS.forEach((island, i) => {
      if (out.length < 12 && normalizePlace(`جزیره ${island.name} ${island.province}`).includes(needle)) out.push({ key: `i${i}`, title: `جزیرهٔ ${island.name}`, sub: island.province, run: () => engineRef.current?.pickIsland(i) });
    });
    return out;
  }, [needle, squares, provinces, cities, onSelectProvince, onSelectCity]);

  const highlight = (title: string) => {
    const at = normalizePlace(title).indexOf(needle);
    if (at < 0 || !needle) return title;
    return (
      <>
        {title.slice(0, at)}
        <mark>{title.slice(at, at + needle.length)}</mark>
        {title.slice(at + needle.length)}
      </>
    );
  };

  return (
    <div ref={hostRef} className="mapsvg" aria-label="نقشه میدان‌های ایران">
      <svg ref={svgRef} className="mapsvg-svg" xmlns={NS} />

      <div className="absolute inset-x-3 top-3 z-[5]">
        <div className={styles.search}>
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                event.currentTarget.blur();
              }
              if (event.key === "Enter" && results[0]) {
                results[0].run();
                setQuery("");
              }
            }}
            placeholder="جستجوی زندهٔ میادین…"
            autoComplete="off"
            aria-label="جست‌وجوی استان، شهر یا میدان روی نقشه"
            dir="rtl"
            className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          />
          <span title="به‌روزرسانی زنده" className={styles.live}>
            <i aria-hidden="true" className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#e4152e]" />
            زنده
          </span>
        </div>
        {focused && needle ? (
          <div className={`${styles.results} mapsvg-res`}>
            {results.length ? (
              results.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    item.run();
                    setQuery("");
                    setFocused(false);
                  }}
                  className="flex w-full flex-col items-start text-right"
                >
                  <b>{highlight(item.title)}</b>
                  <span>{item.sub}</span>
                </button>
              ))
            ) : (
              <div>میدانی با این نام پیدا نشد</div>
            )}
          </div>
        ) : null}
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={() => engineRef.current?.zoom(1.7)} aria-label="بزرگ‌نمایی نقشه" title="بزرگ‌نمایی" className="grid place-items-center active:scale-90">
          <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" onClick={() => engineRef.current?.zoom(1 / 1.7)} aria-label="کوچک‌نمایی نقشه" title="کوچک‌نمایی" className="grid place-items-center active:scale-90">
          <Minus aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" onClick={() => engineRef.current?.fit()} aria-label="نمایش کل ایران" title="کل ایران" className="grid place-items-center active:scale-90">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
        </button>
      </div>

      {card ? (
        <div className="mapsvg-card" role="status">
          <div>
            <b>{card.title}</b>
            {card.sub ? <span>{card.sub}</span> : null}
            <small dir="ltr">{card.coords}</small>
            {card.href ? <Link href={card.href as Route}>مشاهدهٔ نمایه</Link> : null}
          </div>
          <button type="button" className="x" aria-label="بستن" onClick={() => setCard(null)}>×</button>
        </div>
      ) : null}

      {!data ? (
        <div className="absolute inset-0 z-[6] grid place-items-center" style={{ background: "var(--m-bg)" }}>
          {failed ? <p className="text-xs text-muted-foreground">نقشه بارگذاری نشد.</p> : <span className="mapsvg-spin" aria-label="در حال بارگذاری نقشه" />}
        </div>
      ) : null}
    </div>
  );
}
