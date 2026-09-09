import { meydanClientApi } from "@/lib/meydan-client-api";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

type UploadStart = { upload_id: string; chunk_size?: number };
type UploadComplete = { media_id: number; type: string; url: string; size: number };
type CreatedNarrative = { id: number };

async function uploadAttachment(file: File): Promise<UploadComplete> {
  const started = await meydanClientApi<UploadStart>("/uploads", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type,
      size: file.size,
      purpose: "narrative",
    }),
  });

  const chunkSize = started.chunk_size || DEFAULT_CHUNK_SIZE;
  try {
    let index = 0;
    for (let offset = 0; offset < file.size; offset += chunkSize, index += 1) {
      const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
      await meydanClientApi(`/uploads/${encodeURIComponent(started.upload_id)}/chunks/${index}`, {
        method: "PUT",
        body: chunk,
        headers: { "Content-Type": "application/octet-stream" },
      });
    }
    return await meydanClientApi<UploadComplete>(`/uploads/${encodeURIComponent(started.upload_id)}/complete`, {
      method: "POST",
      body: "{}",
    });
  } catch (error) {
    await meydanClientApi(`/uploads/${encodeURIComponent(started.upload_id)}`, { method: "DELETE" }).catch(() => undefined);
    throw error;
  }
}

export async function publishNarrative(input: {
  body: string;
  attachment?: File | null;
  scheduledAt?: string;
  pollOptions?: string[];
}): Promise<CreatedNarrative> {
  const uploaded = input.attachment ? await uploadAttachment(input.attachment) : null;
  const poll = (input.pollOptions || []).map((item) => item.trim()).filter(Boolean);
  const body = poll.length
    ? `${input.body.trim()}\n\n${poll.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
    : input.body.trim();

  return meydanClientApi<CreatedNarrative>("/narratives", {
    method: "POST",
    body: JSON.stringify({
      body,
      published_at: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : undefined,
      attachments: uploaded ? [{ media_id: uploaded.media_id, order: 0 }] : [],
    }),
  });
}
