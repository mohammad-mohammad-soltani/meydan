"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickRecorderFormat, toWaveform, VOICE_MAX_SECONDS, VOICE_MIN_SECONDS } from "./voice-utils";

export type VoiceClip = { file: File; duration: number; waveform: number[] };
type Phase = "idle" | "starting" | "recording";

const LIVE_BARS = 44;

/**
 * Records a voice note with MediaRecorder and measures its loudness live (for the waveform in the
 * composer and the envelope stored with the message). Nothing is uploaded here.
 */
export function useVoiceRecorder(options: { onLimit?: (clip: VoiceClip | null) => void } = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const peaks = useRef<number[]>([]);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const timer = useRef(0);
  const format = useRef<ReturnType<typeof pickRecorderFormat>>(null);
  const onLimit = useRef(options.onLimit);
  useEffect(() => {
    onLimit.current = options.onLimit;
  });

  const teardown = useCallback(() => {
    cancelAnimationFrame(raf.current);
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
    recorder.current = null;
    setPhase("idle");
    setElapsed(0);
    setLevels([]);
  }, []);

  const finish = useCallback((): Promise<VoiceClip | null> => {
    const rec = recorder.current;
    const fmt = format.current;
    if (!rec || !fmt) return Promise.resolve(null);
    const seconds = (performance.now() - startedAt.current) / 1000;
    return new Promise((resolve) => {
      rec.onstop = () => {
        const wave = toWaveform(peaks.current);
        const blob = new Blob(chunks.current, { type: fmt.mime });
        chunks.current = [];
        peaks.current = [];
        teardown();
        if (seconds < VOICE_MIN_SECONDS || blob.size < 200) return resolve(null);
        const file = new File([blob], `voice-${Date.now()}.${fmt.ext}`, { type: fmt.mime });
        resolve({ file, duration: Math.round(seconds * 100) / 100, waveform: wave });
      };
      try {
        if (rec.state !== "inactive") rec.stop();
        else rec.onstop?.(new Event("stop"));
      } catch {
        teardown();
        resolve(null);
      }
    });
  }, [teardown]);

  const start = useCallback(async () => {
    if (phase !== "idle") return;
    setError(null);
    const fmt = pickRecorderFormat();
    if (!fmt || !navigator.mediaDevices?.getUserMedia) {
      setError("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.");
      return;
    }
    setPhase("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      stream.current = media;
      format.current = fmt;
      chunks.current = [];
      peaks.current = [];

      const rec = new MediaRecorder(media, { mimeType: fmt.test, audioBitsPerSecond: 32000 });
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.current = rec;

      // Loudness meter.
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let lastSample = 0;
      let windowPeak = 0;
      const live: number[] = [];
      const tick = (now: number) => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        windowPeak = Math.max(windowPeak, Math.sqrt(sum / buf.length));
        if (now - lastSample >= 70) {
          lastSample = now;
          peaks.current.push(windowPeak);
          live.push(windowPeak);
          if (live.length > LIVE_BARS) live.shift();
          const top = Math.max(0.12, ...live);
          setLevels(live.map((v) => Math.max(0.06, Math.min(1, v / top))));
          windowPeak = 0;
        }
        raf.current = requestAnimationFrame(tick);
      };

      rec.start(250);
      startedAt.current = performance.now();
      setPhase("recording");
      raf.current = requestAnimationFrame(tick);
      timer.current = window.setInterval(() => {
        const s = (performance.now() - startedAt.current) / 1000;
        setElapsed(s);
        if (s >= VOICE_MAX_SECONDS) {
          window.clearInterval(timer.current);
          void finish().then((clip) => onLimit.current?.(clip));
        }
      }, 200);
      if (navigator.vibrate) navigator.vibrate(12);
    } catch (reason) {
      teardown();
      const name = reason instanceof DOMException ? reason.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "اجازهٔ دسترسی به میکروفون داده نشده است. آن را در تنظیمات مرورگر فعال کنید."
          : name === "NotFoundError"
            ? "میکروفونی پیدا نشد."
            : "شروع ضبط صدا انجام نشد.",
      );
    }
  }, [finish, phase, teardown]);

  const stop = useCallback(() => finish(), [finish]);

  const cancel = useCallback(() => {
    const rec = recorder.current;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        /* already stopped */
      }
    }
    chunks.current = [];
    peaks.current = [];
    teardown();
  }, [teardown]);

  useEffect(() => cancel, [cancel]);

  return { phase, recording: phase === "recording", elapsed, levels, error, clearError: () => setError(null), start, stop, cancel };
}
