import { MeydanApiError, getMeydanApiBaseUrl, meydanApi } from "./meydan-api";

type UploadStart = { upload_id: string; chunk_size: number };

export type UploadedFile = {
  media_id: number;
  url?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  poster_url?: string | null;
  thumbnail_url?: string | null;
};

// Vercel Functions reject request payloads above 4.5 MB. Keep binary chunks
// below that ceiling because browser uploads are proxied through /api/meydan.
const MAX_PROXY_SAFE_CHUNK_SIZE = 4 * 1024 * 1024;
/** Chunks sent at once; enough to hide latency without saturating a phone's uplink. */
const PARALLEL_CHUNKS = 3;
const CHUNK_ATTEMPTS = 5;
/** Finishing assembles the file, remuxes video and copies it to object storage. */
const COMPLETE_WINDOW_MS = 10 * 60 * 1000;
/** Window the transfer speed is averaged over. */
const SPEED_WINDOW_MS = 4000;
/** Stats are pushed at most this often; the UI interpolates between them. */
const STATS_INTERVAL_MS = 120;

/** Receives the uploaded fraction (0‥1). */
export type UploadProgressHandler = (fraction: number) => void;
/** `uploading` while bytes travel, `processing` once the server finishes the file. */
export type UploadPhaseHandler = (phase: "uploading" | "processing") => void;

export type UploadStats = {
  phase: "uploading" | "processing";
  /** Bytes the network layer has handed to the server so far (never decreases). */
  loaded: number;
  total: number;
  /** Bytes per second, averaged over the last few seconds. */
  speed: number;
};

export type UploadOptions = {
  purpose?: "narrative" | "avatar" | "cover" | "chat";
  /** Used when the browser reports no MIME type. */
  mimeFallback?: string;
  signal?: AbortSignal;
  onStats?: (stats: UploadStats) => void;
};

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { window.clearTimeout(timer); reject(abortError()); }, { once: true });
  });

const abortError = () => new DOMException("Upload aborted", "AbortError");
export const isUploadAbort = (reason: unknown) => reason instanceof DOMException && reason.name === "AbortError";

/** Network drops, gateway timeouts and rate limits are worth another try; validation errors are not. */
function isTransient(reason: unknown): boolean {
  if (isUploadAbort(reason)) return false;
  if (reason instanceof MeydanApiError) return reason.status === 0 || reason.status === 408 || reason.status === 425 || reason.status === 429 || reason.status >= 500;
  return reason instanceof TypeError;
}

async function withRetry<T>(task: () => Promise<T>, attempts: number, signal?: AbortSignal): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    if (signal?.aborted) throw abortError();
    try {
      return await task();
    } catch (reason) {
      if (attempt >= attempts || !isTransient(reason)) throw reason;
      // 0.8s, 1.6s, 3.2s … with jitter; a flaky mobile link usually recovers within seconds.
      await wait(800 * 2 ** (attempt - 1) + Math.random() * 400, signal);
    }
  }
}

/** One chunk over XHR: `fetch` cannot report how many request bytes have left the device. */
function putChunk(url: string, body: Blob, signal: AbortSignal | undefined, onBytes: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader("content-type", "application/octet-stream");
    xhr.setRequestHeader("accept", "application/json");
    xhr.upload.onprogress = (event) => onBytes(event.lengthComputable ? event.loaded : 0);
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const done = () => signal?.removeEventListener("abort", onAbort);
    xhr.onerror = xhr.ontimeout = () => { done(); reject(new MeydanApiError("network", 0)); };
    xhr.onabort = () => { done(); reject(abortError()); };
    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `upload_chunk_${xhr.status}`;
      let code: string | undefined;
      try {
        const payload = JSON.parse(xhr.responseText) as { error?: { message?: string; code?: string } };
        message = payload.error?.message || message;
        code = payload.error?.code;
      } catch {
        // A gateway error page: keep the status-based message.
      }
      reject(new MeydanApiError(message, xhr.status, { code }));
    };
    xhr.send(body);
  });
}

/**
 * Finishing can outlive the proxy's timeout while the server keeps working.
 * The backend answers a repeated finish with the finished result (or 409 while
 * it is still busy), so a timeout or 409 just means "ask again".
 */
async function complete(uploadId: string, signal?: AbortSignal): Promise<UploadedFile> {
  const deadline = Date.now() + COMPLETE_WINDOW_MS;
  const key = crypto.randomUUID();
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw abortError();
    try {
      return await meydanApi<UploadedFile>(`/uploads/${uploadId}/complete`, { method: "POST", headers: { "idempotency-key": key }, signal });
    } catch (reason) {
      const busy = reason instanceof MeydanApiError && reason.status === 409 && reason.code === "upload_processing";
      if (Date.now() > deadline || !(busy || isTransient(reason))) throw reason;
      await wait(Math.min(8000, 1500 + attempt * 1000), signal);
    }
  }
}

/**
 * Uploads a file in 4 MB chunks, three at a time, each retried on its own.
 * Progress is real bytes sent (not chunks finished), so it moves continuously.
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadedFile> {
  const { purpose = "narrative", mimeFallback = "", signal, onStats } = options;
  const total = file.size;
  const samples: Array<{ t: number; bytes: number }> = [];
  let loaded = 0;
  let lastEmit = 0;
  let phase: UploadStats["phase"] = "uploading";

  const emit = (force = false) => {
    const now = performance.now();
    if (!force && now - lastEmit < STATS_INTERVAL_MS) return;
    lastEmit = now;
    while (samples.length > 1 && now - samples[0].t > SPEED_WINDOW_MS) samples.shift();
    const first = samples[0];
    const span = first ? (now - first.t) / 1000 : 0;
    const speed = first && span > 0.3 ? Math.max(0, (loaded - first.bytes) / span) : 0;
    onStats?.({ phase, loaded, total, speed });
  };
  samples.push({ t: performance.now(), bytes: 0 });
  emit(true);

  const started = await withRetry(
    () =>
      meydanApi<UploadStart>("/uploads", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ filename: file.name, mime_type: file.type || mimeFallback, size: file.size, purpose }),
        signal,
      }),
    3,
    signal,
  );

  const chunkSize =
    Number.isFinite(started.chunk_size) && started.chunk_size > 0
      ? Math.min(started.chunk_size, MAX_PROXY_SAFE_CHUNK_SIZE)
      : MAX_PROXY_SAFE_CHUNK_SIZE;

  const count = Math.ceil(total / chunkSize);
  const sent = new Array<number>(count).fill(0);
  const base = getMeydanApiBaseUrl();
  let next = 0;
  let failed: unknown;

  // The sum never goes backwards: a retried chunk restarts at 0 but keeps the best value it reached.
  const setSent = (index: number, bytes: number) => {
    if (bytes <= sent[index]) return;
    loaded += bytes - sent[index];
    sent[index] = bytes;
    emit();
  };

  // Each worker takes the next unsent chunk; a chunk is idempotent (same index overwrites), so retrying is safe.
  const worker = async () => {
    while (failed === undefined) {
      const index = next++;
      if (index >= count) return;
      const offset = index * chunkSize;
      const part = file.slice(offset, Math.min(offset + chunkSize, total));
      try {
        await withRetry(() => putChunk(`${base}/uploads/${encodeURIComponent(started.upload_id)}/chunks/${index}`, part, signal, (bytes) => setSent(index, Math.min(bytes, part.size))), CHUNK_ATTEMPTS, signal);
        setSent(index, part.size);
      } catch (reason) {
        failed = reason;
        return;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_CHUNKS, count) }, worker));
  if (failed !== undefined) {
    void meydanApi(`/uploads/${started.upload_id}`, { method: "DELETE" }).catch(() => undefined);
    throw failed;
  }

  loaded = total;
  phase = "processing";
  emit(true);
  try {
    return await complete(started.upload_id, signal);
  } catch (reason) {
    if (isUploadAbort(reason)) void meydanApi(`/uploads/${started.upload_id}`, { method: "DELETE" }).catch(() => undefined);
    throw reason;
  }
}

/** The id-only form most screens need. */
export async function uploadNarrativeFile(
  file: File,
  purpose: "narrative" | "avatar" | "cover" = "narrative",
  onProgress?: UploadProgressHandler,
  onPhase?: UploadPhaseHandler,
  signal?: AbortSignal,
): Promise<number> {
  let phase: UploadStats["phase"] | null = null;
  const uploaded = await uploadFile(file, {
    purpose,
    signal,
    onStats: (stats) => {
      onProgress?.(stats.total > 0 ? Math.min(1, stats.loaded / stats.total) : 1);
      if (stats.phase !== phase) {
        phase = stats.phase;
        onPhase?.(stats.phase);
      }
    },
  });
  onProgress?.(1);
  return uploaded.media_id;
}
