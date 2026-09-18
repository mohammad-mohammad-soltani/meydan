/* eslint-disable @next/next/no-img-element -- upload posters may be remote or temporary blob URLs. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import type { MediaItem } from "../types";

/** Fetch a first frame only for visible clips that have no usable server poster. */
export function VideoPreview({ item, onRatio }: {
  item: MediaItem;
  onRatio?: (ratio: number) => void;
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const poster = item.poster && !posterFailed ? item.poster : undefined;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || poster) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [poster]);

  return (
    <span ref={frameRef} className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,#334155,#0f172a_70%)]">
      {!ready && !poster ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-16 text-white/35">
          <Film aria-hidden="true" className="h-8 w-8" />
          <span className="text-[11px]">{failed ? "برای تماشا باز کنید" : "ویدیو"}</span>
        </span>
      ) : null}
      {poster ? (
        <img src={poster} alt="" loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setPosterFailed(true)} />
      ) : visible && !failed && item.src ? (
        <video
          src={item.src}
          muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1}
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (video.videoWidth && video.videoHeight) onRatio?.(video.videoWidth / video.videoHeight);
            // Seeking requests a decodable frame without playing the clip.
            if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 2);
          }}
          onLoadedData={() => setReady(true)}
          onSeeked={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
