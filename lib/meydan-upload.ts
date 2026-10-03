import { MeydanApiError, meydanApi } from "./meydan-api";

type UploadStart = { upload_id: string; chunk_size: number };
type UploadComplete = { media_id: number };

// Vercel Functions reject request payloads above 4.5 MB. Keep binary chunks
// below that ceiling because browser uploads are proxied through /api/meydan.
const MAX_PROXY_SAFE_CHUNK_SIZE = 4 * 1024 * 1024;
/** Chunks sent at once; enough to hide latency without saturating a phone's uplink. */
const PARALLEL_CHUNKS = 3;
const CHUNK_ATTEMPTS = 5;
/** Finishing assembles the file, remuxes video and copies it to object storage. */
const COMPLETE_WINDOW_MS = 10 * 60 * 1000;

/** Receives the uploaded fraction (0‥1) after every chunk. */
export type UploadProgressHandler = (fraction: number) => void;
/** `uploading` while bytes travel, `processing` once the server finishes the file. */
export type UploadPhaseHandler = (phase: "uploading" | "processing") => void;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Network drops, gateway timeouts and rate limits are worth another try; validation errors are not. */
function isTransient(reason: unknown): boolean {
  if (reason instanceof MeydanApiError) return reason.status === 0 || reason.status === 408 || reason.status === 425 || reason.status === 429 || reason.status >= 500;
  return reason instanceof TypeError;
}

async function withRetry<T>(task: () => Promise<T>, attempts: number): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await task();
    } catch (reason) {
      if (attempt >= attempts || !isTransient(reason)) throw reason;
      // 0.8s, 1.6s, 3.2s … with jitter; a flaky mobile link usually recovers within seconds.
      await wait(800 * 2 ** (attempt - 1) + Math.random() * 400);
    }
  }
}

/**
 * Finishing can outlive the proxy's timeout while the server keeps working.
 * The backend answers a repeated finish with the finished result (or 409 while
 * it is still busy), so a timeout or 409 just means "ask again".
 */
async function complete(uploadId: string): Promise<UploadComplete> {
  const deadline = Date.now() + COMPLETE_WINDOW_MS;
  const key = crypto.randomUUID();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await meydanApi<UploadComplete>(`/uploads/${uploadId}/complete`, { method: "POST", headers: { "idempotency-key": key } });
    } catch (reason) {
      const busy = reason instanceof MeydanApiError && reason.status === 409 && reason.code === "upload_processing";
      if (Date.now() > deadline || !(busy || isTransient(reason))) throw reason;
      await wait(Math.min(8000, 1500 + attempt * 1000));
    }
  }
}

export async function uploadNarrativeFile(
  file: File,
  purpose: "narrative" | "avatar" | "cover" = "narrative",
  onProgress?: UploadProgressHandler,
  onPhase?: UploadPhaseHandler,
): Promise<number> {
  onPhase?.("uploading");
  const started = await withRetry(
    () =>
      meydanApi<UploadStart>("/uploads", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ filename: file.name, mime_type: file.type, size: file.size, purpose }),
      }),
    3,
  );

  const chunkSize =
    Number.isFinite(started.chunk_size) && started.chunk_size > 0
      ? Math.min(started.chunk_size, MAX_PROXY_SAFE_CHUNK_SIZE)
      : MAX_PROXY_SAFE_CHUNK_SIZE;

  if (file.size === 0) onProgress?.(1);

  const total = Math.ceil(file.size / chunkSize);
  const sent = new Array<number>(total).fill(0);
  let next = 0;
  let failed: unknown;
  const report = () => onProgress?.(Math.min(1, sent.reduce((sum, value) => sum + value, 0) / file.size));

  // Each worker takes the next unsent chunk; a chunk is idempotent (same index overwrites), so retrying is safe.
  const worker = async () => {
    while (failed === undefined) {
      const index = next++;
      if (index >= total) return;
      const offset = index * chunkSize;
      const part = file.slice(offset, Math.min(offset + chunkSize, file.size));
      try {
        await withRetry(
          () =>
            meydanApi(`/uploads/${started.upload_id}/chunks/${index}`, {
              method: "PUT",
              headers: { "content-type": "application/octet-stream" },
              body: part,
            }),
          CHUNK_ATTEMPTS,
        );
        sent[index] = part.size;
        report();
      } catch (reason) {
        failed = reason;
        return;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_CHUNKS, total) }, worker));
  if (failed !== undefined) {
    void meydanApi(`/uploads/${started.upload_id}`, { method: "DELETE" }).catch(() => undefined);
    throw failed;
  }

  onProgress?.(1);
  onPhase?.("processing");
  const completed = await complete(started.upload_id);
  return completed.media_id;
}
