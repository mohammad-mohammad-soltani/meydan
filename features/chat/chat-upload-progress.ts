export type ChatUploadPhase = "uploading" | "processing";

export type ChatUploadProgressDetail = {
  key: string;
  progress: number;
  phase: ChatUploadPhase;
};

export const CHAT_UPLOAD_PROGRESS_EVENT = "meydan:chat-upload-progress";

export function chatUploadKey(name: string, size: number): string {
  return `${name}\u0000${size}`;
}

export function emitChatUploadProgress(detail: ChatUploadProgressDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ChatUploadProgressDetail>(CHAT_UPLOAD_PROGRESS_EVENT, { detail }));
}

export function subscribeToChatUploadProgress(
  callback: (detail: ChatUploadProgressDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ChatUploadProgressDetail>).detail;
    if (detail) callback(detail);
  };

  window.addEventListener(CHAT_UPLOAD_PROGRESS_EVENT, handler);
  return () => window.removeEventListener(CHAT_UPLOAD_PROGRESS_EVENT, handler);
}
