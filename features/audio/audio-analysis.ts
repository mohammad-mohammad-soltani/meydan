/**
 * Live spectrum for the equalizer.
 *
 * The browser only hands out spectrum data for a cross-origin file when the file's host sends
 * CORS headers. So nothing is routed through Web Audio until a host has been probed and
 * answered "yes": playback itself is never put at risk, and a host that says "no" simply keeps
 * the equalizer on its stand-in animation.
 */

const BARS = 30;
const verdicts = new Map<string, boolean>();
const probes = new Map<string, Promise<boolean>>();

function originOf(url: string): string | null {
  try {
    return new URL(url, window.location.href).origin;
  } catch {
    return null;
  }
}

/** The known answer for a file's host; undefined while nobody has asked yet. */
export function peekCors(url: string): boolean | undefined {
  const origin = originOf(url);
  if (!origin) return false;
  if (origin === window.location.origin) return true;
  return verdicts.get(origin);
}

/** Asks the host once (one byte, no caching) whether pages from here may read its media. */
export function probeCors(url: string): Promise<boolean> {
  const origin = originOf(url);
  if (!origin) return Promise.resolve(false);
  if (origin === window.location.origin) return Promise.resolve(true);
  const known = verdicts.get(origin);
  if (known !== undefined) return Promise.resolve(known);
  let pending = probes.get(origin);
  if (!pending) {
    pending = fetch(url, { mode: "cors", cache: "no-store", headers: { Range: "bytes=0-0" } })
      .then((response) => response.ok || response.status === 206)
      .catch(() => false)
      .then((ok) => {
        verdicts.set(origin, ok);
        probes.delete(origin);
        return ok;
      });
    probes.set(origin, pending);
  }
  return pending;
}

// ---- live levels, shared by whoever draws them ----------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
let levels: readonly number[] | null = null;

export const subscribeLevels = (listener: Listener) => {
  listeners.add(listener);
  startLoop();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopLoop();
  };
};
export const getLevels = () => levels;
export const getServerLevels = () => null;

const notify = () => listeners.forEach((listener) => listener());

// ---- the analyser ---------------------------------------------------------------------------

type Graph = { context: AudioContext; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> };
const graphs = new WeakMap<HTMLAudioElement, Graph>();
let active: HTMLAudioElement | null = null;
let frame = 0;
let smooth: number[] = new Array(BARS).fill(0);

/** Routes an element through an analyser. Only for elements loaded with crossOrigin="anonymous". */
export function attachAnalyser(audio: HTMLAudioElement): void {
  if (audio.crossOrigin !== "anonymous") return;
  active = audio;
  let graph = graphs.get(audio);
  if (!graph) {
    try {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      const context = new Context();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      analyser.minDecibels = -88;
      analyser.maxDecibels = -22;
      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      graph = { context, analyser, data: new Uint8Array(analyser.frequencyBinCount) };
      graphs.set(audio, graph);
    } catch {
      return;
    }
  }
  void graph.context.resume().catch(() => undefined);
  startLoop();
}

export function analysisPaused(): void {
  if (levels) {
    levels = null;
    notify();
  }
  stopLoop();
}

function startLoop() {
  if (frame || !active || !listeners.size) return;
  const graph = graphs.get(active);
  if (!graph) return;
  const step = () => {
    frame = 0;
    const element = active;
    const current = element ? graphs.get(element) : undefined;
    if (!element || !current || !listeners.size) return;
    if (!element.paused) {
      current.analyser.getByteFrequencyData(current.data);
      // Log-spaced groups over the audible part, so voice and music both move the bars.
      const usable = Math.min(current.data.length, 110);
      const next: number[] = [];
      for (let bar = 0; bar < BARS; bar++) {
        const from = Math.floor(Math.pow(usable, bar / BARS));
        const to = Math.max(from + 1, Math.floor(Math.pow(usable, (bar + 1) / BARS)));
        let sum = 0;
        for (let i = from; i < to && i < usable; i++) sum += current.data[i];
        const value = sum / (to - from) / 255;
        smooth[bar] = Math.max(value, smooth[bar] * 0.82);
        next.push(Math.min(1, Math.pow(smooth[bar], 1.6) * 1.05));
      }
      levels = next;
      notify();
    }
    frame = window.requestAnimationFrame(step);
  };
  frame = window.requestAnimationFrame(step);
}

function stopLoop() {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
  smooth = new Array(BARS).fill(0);
}
