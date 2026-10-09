/** Shared helpers for `@handle` mentions: detection while typing, splitting rendered text, and the profile link. */

/** Mirrors `Handles::MIN`/`MAX` and `Mentions::extract` in the backend. */
const HANDLE_BODY = "[A-Za-z0-9_]{3,30}";
const LEAD = String.raw`(^|[\s،؛.,!?؟()[\]{}>])`;

export type MentionToken = { start: number; query: string };

export type MentionPart = { text: string; handle?: string };

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** `رضا` stays as typed; Persian digits and case are folded the way the backend folds handles. */
export function normalizeMentionQuery(query: string): string {
  return query
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .toLowerCase();
}

/**
 * The `@` token the caret sits inside, if any: an `@` that starts the text
 * or follows whitespace/punctuation (so an email's `@` never opens it), with
 * only handle characters between it and the caret.
 */
export function activeMentionToken(text: string, caret: number): MentionToken | null {
  const match = text
    .slice(0, caret)
    .match(/(?:^|[\s،؛.,!?؟()[\]{}])@([A-Za-z0-9_۰-۹]{0,30})$/u);
  if (!match) return null;
  return { start: caret - match[1].length - 1, query: match[1] };
}

/** `/handle`, the public profile address of any account kind. */
export function mentionHref(handle: string): string {
  return `/${handle.toLowerCase()}`;
}

/** Fresh regex (they are stateful) matching a finished `@handle` and the character before it. */
export function mentionPattern(): RegExp {
  return new RegExp(`${LEAD}@(${HANDLE_BODY})(?![A-Za-z0-9_@])`, "gu");
}

/**
 * Plain text split into ordinary runs and `@handle` mentions. `isProfile` lets the
 * caller leave out handles that are not profile addresses (reserved route names).
 */
export function splitMentions(text: string, isProfile: (handle: string) => boolean = () => true): MentionPart[] {
  const parts: MentionPart[] = [];
  let last = 0;
  for (const match of text.matchAll(mentionPattern())) {
    const handle = match[2];
    if (!isProfile(handle)) continue;
    const start = (match.index ?? 0) + match[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: `@${handle}`, handle });
    last = start + handle.length + 1;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
