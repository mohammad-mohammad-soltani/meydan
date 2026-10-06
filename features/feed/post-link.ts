/**
 * Twitter-style link unfurling: a plain-text link to one of our own posts is
 * pulled out of the body so the reader sees an embedded post card instead of
 * a raw URL, the same way a structured quote-repost already renders.
 */
export function extractPostLink(text: string): { cleanedText: string; postId: string } | null {
  if (typeof window === "undefined" || !text) return null;
  const re = /https?:\/\/[^\s]+\/posts\/(\d+)(?:[/?#]\S*)?/g;
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
    return { cleanedText, postId: match[1] };
  }
  return null;
}
