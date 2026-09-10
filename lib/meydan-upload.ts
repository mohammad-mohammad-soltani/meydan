import { meydanApi } from "./meydan-api";

type UploadStart = { upload_id: string; chunk_size: number };
type UploadComplete = { media_id: number };

export async function uploadNarrativeFile(file: File, purpose: "narrative" | "avatar" | "cover" = "narrative"): Promise<number> {
  const started = await meydanApi<UploadStart>("/uploads", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ filename: file.name, mime_type: file.type, size: file.size, purpose }),
  });
  for (let offset = 0, index = 0; offset < file.size; offset += started.chunk_size, index += 1) {
    await meydanApi(`/uploads/${started.upload_id}/chunks/${index}`, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: file.slice(offset, offset + started.chunk_size),
    });
  }
  const completed = await meydanApi<UploadComplete>(`/uploads/${started.upload_id}/complete`, {
    method: "POST",
    headers: { "idempotency-key": crypto.randomUUID() },
  });
  return completed.media_id;
}
