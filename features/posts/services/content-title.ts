/**
 * Produces the editable default title for a narrative converted to content.
 * The title is the first non-empty line, with emoji and surplus whitespace removed.
 */
export function suggestedContentTitle(body: string, narrativeId?: number): string {
  const firstLine = body.split(/\r?\n/u).find((line) => line.trim()) ?? "";
  const withoutEmoji = firstLine
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\u200D\uFE0F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return withoutEmoji || `محتوا از روایت #${narrativeId ?? ""}`.trim();
}
