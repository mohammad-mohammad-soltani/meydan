"use client";

import { Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ChatAttachment } from "../types";
import { claimVoicePlayback, formatVoiceTime, releaseVoicePlayback, resampleWaveform } from "../voice/voice-utils";

const RATES = [1, 1.5, 2] as const;
const BARS = 34;

type Transfer = { progress: number; phase: "uploading" | "processing" } | null;

/**
 * Voice note: play / pause, a tappable + draggable waveform, elapsed / total time and 1× 1.5× 2× speed.
 * Colours come from `currentColor`, so it fits both bubble colours.
 */
export function VoiceMessage({ attachment, transfer, isOwn = false }: { attachment: ChatAttachment; transfer: Transfer; isOwn?: boolean }) {
  const src = attachment.url || attachment.previewUrl;
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const wave = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [rateIndex, setRateIndex] = useState(0);
  const [measured, setMeasured] = useState(0);
  const total = attachment.duration || measured || 0;
  const bars = useMemo(() => resampleWaveform(attachment.waveform, BARS, attachment.id), [attachment.waveform, attachment.id]);
  const ratio = total > 0 ? Math.min(1, current / total) : 0;
  const busy = !!transfer;

  const handle = useRef({ pause: () => undefined as void });
  const pause = useCallback(() => {
    audio.current?.pause();
    cancelAnimationFrame(raf.current);
    setPlaying(false);
  }, []);
  useEffect(() => {
    handle.current = { pause };
  }, [pause]);

  const loopRef = useRef<() => void>(() => undefined);
  const loop = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    setCurrent(el.currentTime);
    raf.current = requestAnimationFrame(loopRef.current);
  }, []);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const ensureAudio = useCallback(() => {
    if (audio.current || !src) return audio.current;
    const el = new Audio();
    el.preload = "metadata";
    el.src = src;
    el.onloadedmetadata = () => {
      // MediaRecorder files often report Infinity; the stored duration then stands in.
      if (Number.isFinite(el.duration) && el.duration > 0) setMeasured(el.duration);
    };
    el.onwaiting = () => setLoading(true);
    el.oncanplay = () => setLoading(false);
    el.onplaying = () => {
      setLoading(false);
      setPlaying(true);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(loop);
    };
    el.onpause = () => {
      cancelAnimationFrame(raf.current);
      setPlaying(false);
    };
    el.onended = () => {
      cancelAnimationFrame(raf.current);
      setPlaying(false);
      setCurrent(0);
      el.currentTime = 0;
      releaseVoicePlayback(handle.current);
    };
    el.onerror = () => {
      cancelAnimationFrame(raf.current);
      setPlaying(false);
      setLoading(false);
      setFailed(true);
    };
    audio.current = el;
    return el;
  }, [loop, src]);

  const toggle = useCallback(async () => {
    if (busy || !src) return;
    if (playing) {
      pause();
      return;
    }
    const el = ensureAudio();
    if (!el) return;
    setFailed(false);
    claimVoicePlayback(handle.current);
    el.playbackRate = RATES[rateIndex];
    setLoading(true);
    try {
      await el.play();
    } catch {
      setLoading(false);
      setFailed(true);
    }
  }, [busy, ensureAudio, pause, playing, rateIndex, src]);

  const seekTo = useCallback(
    (clientX: number) => {
      const box = wave.current?.getBoundingClientRect();
      if (!box || !total) return;
      const next = Math.min(1, Math.max(0, (clientX - box.left) / box.width)) * total;
      const el = ensureAudio();
      if (el) {
        try {
          el.currentTime = next;
        } catch {
          /* metadata not ready yet */
        }
      }
      setCurrent(next);
    },
    [ensureAudio, total],
  );

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy) return;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekTo(event.clientX);
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) seekTo(event.clientX);
  };
  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const cycleRate = () => {
    const next = (rateIndex + 1) % RATES.length;
    setRateIndex(next);
    if (audio.current) audio.current.playbackRate = RATES[next];
  };

  useEffect(() => {
    const player = handle.current;
    return () => {
      cancelAnimationFrame(raf.current);
      releaseVoicePlayback(player);
      const el = audio.current;
      if (el) {
        el.onended = el.onerror = el.onpause = el.onplaying = el.onwaiting = el.oncanplay = el.onloadedmetadata = null;
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      audio.current = null;
    };
  }, []);

  const label = busy ? (transfer?.phase === "processing" ? "در حال پردازش…" : "در حال ارسال…") : failed ? "پخش نشد" : formatVoiceTime(playing || current > 0 ? current : total);
  const progress = Math.min(100, Math.max(0, transfer?.progress ?? 0));

  return (
    <div dir="ltr" className="voice-msg flex min-w-[210px] max-w-full items-center gap-2.5 py-0.5 pe-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy || !src}
        aria-label={busy ? "در حال ارسال پیام صوتی" : failed ? "تلاش دوباره برای پخش" : playing ? "توقف پیام صوتی" : "پخش پیام صوتی"}
        style={{ background: isOwn ? "var(--m-bg)" : "var(--m-tx)", color: isOwn ? "var(--m-tx)" : "var(--m-bg)" }}
        className="voice-play relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-100"
      >
        {busy ? (
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.4" opacity=".25" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress} className="transition-[stroke-dashoffset] duration-150" />
          </svg>
        ) : null}
        {loading || busy ? <Loader2 aria-hidden="true" className={`h-[18px] w-[18px] ${busy ? "" : "animate-spin"}`} style={busy ? { opacity: 0 } : undefined} /> : failed ? <RotateCcw aria-hidden="true" className="h-[18px] w-[18px]" /> : playing ? <Pause aria-hidden="true" className="h-[18px] w-[18px] fill-current" /> : <Play aria-hidden="true" className="h-[18px] w-[18px] translate-x-[1px] fill-current" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          ref={wave}
          role="slider"
          tabIndex={busy ? -1 : 0}
          aria-label="موقعیت پخش"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(current)}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(event) => {
            if (!total) return;
            const step = event.key === "ArrowRight" ? 5 : event.key === "ArrowLeft" ? -5 : 0;
            if (!step) return;
            event.preventDefault();
            const el = ensureAudio();
            const next = Math.min(total, Math.max(0, (el?.currentTime ?? current) + step));
            if (el) el.currentTime = next;
            setCurrent(next);
          }}
          className="voice-wave flex h-8 cursor-pointer touch-none select-none items-center gap-[2px]"
        >
          {bars.map((value, index) => {
            const done = (index + 0.5) / bars.length <= ratio;
            return <span key={index} className="voice-bar block w-[3px] shrink-0 rounded-full bg-current" style={{ height: `${Math.max(14, value * 0.9)}%`, opacity: done ? 1 : 0.32, flex: "1 1 0", maxWidth: 4 }} />;
          })}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10.5px] leading-4 opacity-75">
          <span className="tabular-nums">{label}</span>
          {(playing || current > 0) && !busy ? (
            <button type="button" onClick={cycleRate} aria-label="سرعت پخش" className="rounded-full bg-current/15 px-1.5 text-[10px] font-bold tabular-nums" style={{ backgroundColor: "color-mix(in srgb, currentColor 16%, transparent)" }}>
              {RATES[rateIndex].toLocaleString("fa-IR")}×
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
