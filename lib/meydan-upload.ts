import { meydanApi } from "./meydan-api";

type UploadStart = { upload_id: string; chunk_size: number };
type UploadComplete = { media_id: number };

// Vercel Functions reject request payloads above 4.5 MB. Keep binary chunks
// below that ceiling because browser uploads are proxied through /api/meydan.
const MAX_PROXY_SAFE_CHUNK_SIZE = 4 * 1024 * 1024;

export async function uploadNarrativeFile(file: File, purpose: "narrative" | "avatar" | "cover" = "narrative"): Promise<number> {
  const started = await meydanApi<UploadStart>("/uploads", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ filename: file.name, mime_type: file.type, size: file.size, purpose }),
  });

  const chunkSize =
    Number.isFinite(started.chunk_size) && started.chunk_size > 0
      ? Math.min(started.chunk_size, MAX_PROXY_SAFE_CHUNK_SIZE)
      : MAX_PROXY_SAFE_CHUNK_SIZE;

  for (let offset = 0, index = 0; offset < file.size; offset += chunkSize, index += 1) {
    await meydanApi(`/uploads/${started.upload_id}/chunks/${index}`, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: file.slice(offset, offset + chunkSize),
    });
  }

  const completed = await meydanApi<UploadComplete>(`/uploads/${started.upload_id}/complete`, {
    method: "POST",
    headers: { "idempotency-key": crypto.randomUUID() },
  });
  return completed.media_id;
}
