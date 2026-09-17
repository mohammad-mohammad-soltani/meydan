export type ContentVideoAttachment = {
  id: number;
  type?: string;
  width?: number | null;
  height?: number | null;
};

export function contentVideo(
  contentId: number,
  primaryAttachmentId: number | undefined,
  attachments: ContentVideoAttachment[] | undefined,
): { src: string; width?: number; height?: number } | undefined {
  const primary = attachments?.find((attachment) => attachment.id === primaryAttachmentId);
  const video = primary?.type === "video"
    ? primary
    : attachments?.find((attachment) => attachment.type === "video");
  if (!video) return undefined;

  return {
    src: `/api/content/${contentId}/media/${video.id}`,
    width: video.width ?? undefined,
    height: video.height ?? undefined,
  };
}
