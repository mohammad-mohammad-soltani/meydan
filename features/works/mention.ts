/** Only the token immediately before the caret opens member suggestions. */
export function mentionToken(text: string, caret: number) {
  const match = /(?:^|\s)@([^\s@]*)$/u.exec(text.slice(0, caret));
  return match ? { query: match[1], start: caret - match[1].length - 1, end: caret } : null;
}

export function insertMention(text: string, token: { start: number; end: number }, handle: string) {
  return text.slice(0, token.start) + handle + " " + text.slice(token.end);
}

const HANDLE = /(@[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)/gu;

/** Split text into plain parts and `@handle` mentions (for highlighting). */
export function splitMentions(text: string): { text: string; mention: boolean }[] {
  return text
    .split(HANDLE)
    .filter(Boolean)
    .map((part) => ({ text: part, mention: part.startsWith("@") && part.length > 1 }));
}
