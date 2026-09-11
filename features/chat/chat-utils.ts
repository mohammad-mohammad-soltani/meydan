import type { ChatAttachment, ChatUser } from "./types";

export type ChatAttachmentKind = "image" | "video" | "audio" | "file";

type SearchableMessage = {
  id: string;
  body?: string;
  attachment?: Partial<ChatAttachment>;
};

export type SharedMediaItem = {
  id: string;
  attachment: Partial<ChatAttachment>;
};

export type SharedLinkItem = {
  id: string;
  url: string;
};

export function classifyChatAttachment(attachment: Pick<ChatAttachment, "mimeType"> | { mimeType?: string }): ChatAttachmentKind {
  const mime = String(attachment.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export function attachmentSource(attachment?: Partial<ChatAttachment>): string {
  return String(attachment?.url || attachment?.previewUrl || "");
}

export function filterChatMessages<T extends SearchableMessage>(messages: T[], query: string): T[] {
  const normalized = query.trim().toLocaleLowerCase("fa");
  if (!normalized) return messages;
  return messages.filter((message) => {
    const haystack = `${message.body || ""}\n${message.attachment?.name || ""}`.toLocaleLowerCase("fa");
    return haystack.includes(normalized);
  });
}

export function collectConversationSharedItems<T extends SearchableMessage>(messages: T[]) {
  const media: SharedMediaItem[] = [];
  const files: SharedMediaItem[] = [];
  const links: SharedLinkItem[] = [];
  const seenLinks = new Set<string>();

  for (const message of messages) {
    if (message.attachment) {
      const kind = classifyChatAttachment({ mimeType: message.attachment.mimeType });
      const item = { id: message.id, attachment: message.attachment };
      if (kind === "image" || kind === "video") media.push(item);
      else files.push(item);
    }

    const matches = String(message.body || "").match(/https?:\/\/[^\s<>"']+/gi) || [];
    for (const raw of matches) {
      const url = raw.replace(/[),.;!?،؛]+$/u, "");
      if (!url || seenLinks.has(url)) continue;
      seenLinks.add(url);
      links.push({ id: `${message.id}:${links.length}`, url });
    }
  }

  return { media, files, links };
}

export function participantProfileHref(participant: Pick<ChatUser, "id"> & Partial<Pick<ChatUser, "profileType" | "profileId">>): string {
  const type = participant.profileType === "square" ? "square" : "user";
  const id = participant.profileId || participant.id;
  return `/profile/${type}/${id}`;
}
