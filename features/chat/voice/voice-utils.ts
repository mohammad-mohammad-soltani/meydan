/** Shared helpers for voice notes: formats, waveform sampling and the single-player rule. */

export const VOICE_MIN_SECONDS = 0.6;
export const VOICE_MAX_SECONDS = 15 * 60;
export const VOICE_BARS = 64;

/** Browser recorders in order of preference: widest playback support first, then smallest files. */
const CANDIDATES: ReadonlyArray<{ test: string; mime: string; ext: string }> = [
  { test: "audio/mp4;codecs=mp4a.40.2", mime: "audio/mp4", ext: "m4a" },
  { test: "audio/mp4", mime: "audio/mp4", ext: "m4a" },
  { test: "audio/ogg;codecs=opus", mime: "audio/ogg", ext: "ogg" },
  { test: "audio/webm;codecs=opus", mime: "audio/webm", ext: "weba" },
  { test: "audio/webm", mime: "audio/webm", ext: "weba" },
];

export function pickRecorderFormat(): { test: string; mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.test)) ?? null;
}

export function voiceRecordingSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && pickRecorderFormat() !== null;
}

/** m:ss with Persian digits. */
export function formatVoiceTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toLocaleString("fa-IR")}:${s.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}`;
}

/** Collapses raw amplitude samples into `bars` values (0‥100) with a perceptual curve, so quiet speech is still visible. */
export function toWaveform(samples: number[], bars = VOICE_BARS): number[] {
  if (!samples.length) return Array.from({ length: bars }, () => 8);
  const out: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor((i / bars) * samples.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / bars) * samples.length));
    let peak = 0;
    for (let j = from; j < to && j < samples.length; j += 1) peak = Math.max(peak, samples[j]);
    out.push(peak);
  }
  const max = Math.max(...out, 0.0001);
  return out.map((v) => Math.round(Math.max(6, Math.pow(v / max, 0.7) * 100)));
}

/** Resamples a stored waveform to `count` bars for the current width. */
export function resampleWaveform(wave: number[] | undefined, count: number, seed = ""): number[] {
  if (wave && wave.length) {
    return Array.from({ length: count }, (_, i) => {
      const from = Math.floor((i / count) * wave.length);
      const to = Math.max(from + 1, Math.floor(((i + 1) / count) * wave.length));
      let peak = 0;
      for (let j = from; j < to && j < wave.length; j += 1) peak = Math.max(peak, wave[j]);
      return peak;
    });
  }
  // Older / foreign audio without an envelope: a stable pseudo waveform.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 16777619);
    return 22 + ((h >>> 0) % 58);
  });
}

/** Only one voice note plays at a time (and never together with other media). */
let active: { pause: () => void } | null = null;
export function claimVoicePlayback(player: { pause: () => void }) {
  if (active && active !== player) active.pause();
  active = player;
}
export function releaseVoicePlayback(player: { pause: () => void }) {
  if (active === player) active = null;
}
