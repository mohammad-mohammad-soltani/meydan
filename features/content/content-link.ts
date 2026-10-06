/**
 * A plain-text link to one of our own content pages (`/content/<id>`), pulled out of a message body so it can be
 * shown as a card — the same unfurling posts get.
 */
export function extractContentLink(text: string): { cleanedText: string; contentId: string } | null {
  if (typeof window === "undefined" || !text) return null;
  const re = /https?:\/\/[^\s]+\/content\/(\d+)(?:[/?#]\S*)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    let host: string;
    try {
      host = new URL(match[0]).host;
    } catch {
      continue;
    }
    if (host !== window.location.host) continue;
    const cleanedText = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { cleanedText, contentId: match[1] };
  }
  return null;
}
