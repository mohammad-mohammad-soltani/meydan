export type ContentAudioAttachment = {
  id: number;
  type?: string;
  url?: string;
};

export function contentAudioSource(
  primaryAttachmentId: number | undefined,
  attachments: ContentAudioAttachment[] | undefined,
): string | undefined {
  const primary = attachments?.find(
    (attachment) => attachment.id === primaryAttachmentId,
  );
  const audio =
    primary?.type === "audio" && primary.url
      ? primary
      : attachments?.find(
          (attachment) => attachment.type === "audio" && Boolean(attachment.url),
        );

  return audio?.url;
}
