"use client";

/* eslint-disable @next/next/no-img-element -- Object URLs must be rendered at their exact pixels for interactive canvas cropping. */

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

export function ImageCropDialog({
  file,
  purpose,
  onCancel,
  onApply,
}: {
  file: File;
  purpose: "avatar" | "cover";
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  // Active touches/pointers on the frame: one drags the image, two pinch-zoom it.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "drag"; x: number; y: number; px: number; py: number }
    | { kind: "pinch"; zoom: number; dist: number; x: number; y: number; cx: number; cy: number }
    | null
  >(null);
  const [ratio, setRatio] = useState(1);
  const MAX_ZOOM = 4;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [saving, setSaving] = useState(false);
  const aspect = purpose === "avatar" ? 1 : 3;
  const baseWidth = ratio >= aspect ? (100 * ratio) / aspect : 100;
  const baseHeight = ratio >= aspect ? 100 : (100 * aspect) / ratio;
  const maxX = Math.max(0, (baseWidth * zoom - 100) / 2);
  const maxY = Math.max(0, (baseHeight * zoom - 100) / 2);
  const width = (size.width * baseWidth * zoom) / 100;
  const height = (size.height * baseHeight * zoom) / 100;
  // Created inside the effect (not memoised) so React StrictMode's simulated unmount
  // cannot revoke a URL the re-mounted dialog is still showing.
  useEffect(() => {
    const next = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs must be created and revoked together with the effect.
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
  const limits = (z: number) => ({
    mx: Math.max(0, (baseWidth * z - 100) / 2),
    my: Math.max(0, (baseHeight * z - 100) / 2),
  });
  const applyView = (nextZoom: number, nextX: number, nextY: number) => {
    const z = Math.max(1, Math.min(MAX_ZOOM, nextZoom));
    const { mx, my } = limits(z);
    setZoom(z);
    setX(clamp(nextX, mx));
    setY(clamp(nextY, my));
  };
  const beginGesture = () => {
    const points = Array.from(pointers.current.values());
    if (points.length >= 2) {
      const [a, b] = points;
      gesture.current = {
        kind: "pinch",
        zoom,
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        x,
        y,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    } else if (points.length === 1) {
      gesture.current = { kind: "drag", x, y, px: points[0].x, py: points[0].y };
    } else {
      gesture.current = null;
    }
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!frame.current || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const state = gesture.current;
    if (!state) return;
    const box = frame.current.getBoundingClientRect();
    if (state.kind === "drag") {
      applyView(
        zoom,
        state.x + ((event.clientX - state.px) / box.width) * 100,
        state.y + ((event.clientY - state.py) / box.height) * 100,
      );
      return;
    }
    const [a, b] = Array.from(pointers.current.values());
    if (!a || !b) return;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    applyView(
      state.zoom * (dist / state.dist),
      state.x + ((cx - state.cx) / box.width) * 100,
      state.y + ((cy - state.cy) / box.height) * 100,
    );
  };
  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    beginGesture();
  };
  const apply = async () => {
    setSaving(true);
    try {
      if (!url) return;
      const image = new Image();
      image.src = url;
      await image.decode();
      const h = 1000;
      const w = Math.round(h * aspect);
      const scale =
        Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        image,
        (w - dw) / 2 + (x * w) / 100,
        (h - dh) / 2 + (y * h) / 100,
        dw,
        dh,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (blob)
        await onApply(
          new File([blob], `${purpose}-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
    } finally {
      setSaving(false);
    }
  };
  const imgStyle = {
    width: `${width}px`,
    height: `${height}px`,
    left: `calc(50% + ${(x * size.width) / 100}px)`,
    top: `calc(50% + ${(y * size.height) / 100}px)`,
    transform: "translate(-50%, -50%)",
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ویرایش رسانه"
      className="fixed inset-0 z-[9999] bg-solid-dark/85 sm:flex sm:items-center sm:justify-center sm:p-5"
    >
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#eef5f8] sm:h-[min(820px,90dvh)] sm:rounded-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between bg-surface px-4 text-foreground">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 text-xs font-bold"
          >
            بازگشت
          </button>
          <h2 className="text-sm font-black">ویرایش رسانه</h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => void apply()}
            className="min-h-9 rounded-pill bg-foreground px-4 text-xs font-black text-background"
          >
            {saving ? "در حال آماده‌سازی…" : "اعمال"}
          </button>
        </header>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5">
          <img
            src={url || undefined}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute max-w-none opacity-25"
            style={imgStyle}
          />
          <div
            ref={frame}
            className={`relative touch-none overflow-hidden border-4 border-info shadow-lg ${purpose === "avatar" ? "h-72 w-72 rounded-full" : "aspect-[3/1] w-full rounded-sm"}`}
            onPointerDown={(event) => {
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              event.currentTarget.setPointerCapture(event.pointerId);
              beginGesture();
            }}
            onPointerMove={move}
            onPointerUp={release}
            onPointerCancel={release}
            onWheel={(event) => {
              // Trackpad pinch (ctrl+wheel) and mouse wheel zoom on desktop.
              applyView(zoom * Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.002)), x, y);
            }}
          >
            <img
              src={url || undefined}
              alt="برای جابه‌جایی تصویر، آن را بکشید"
              draggable={false}
              onLoad={(event) => {
                setRatio(
                  event.currentTarget.naturalWidth /
                    event.currentTarget.naturalHeight,
                );
                const box = frame.current?.getBoundingClientRect();
                if (box) setSize({ width: box.width, height: box.height });
              }}
              className="absolute max-w-none select-none"
              style={imgStyle}
            />
          </div>
        </div>
        <div className="shrink-0 border-t border-divider bg-surface px-5 py-5">
          <p className="mb-3 text-center text-xs text-foreground-subtle">
            برای جابه‌جایی، تصویر را بکشید؛ برای بزرگ‌نمایی با دو انگشت بکشید.
          </p>
          <div className="flex items-center gap-3">
            <Minus className="h-4 w-4 text-icon-muted" />
            <input
              aria-label="بزرگ‌نمایی"
              type="range"
              min="1"
              max={MAX_ZOOM}
              step=".05"
              value={zoom}
              onChange={(event) => applyView(Number(event.target.value), x, y)}
              className="w-full accent-info"
            />
            <Plus className="h-4 w-4 text-icon-muted" />
          </div>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setX(0);
              setY(0);
            }}
            className="mx-auto mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-foreground-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            بازنشانی
          </button>
        </div>
      </div>
    </div>
  );
}
