/**
 * Truncation for long post bodies.
 *
 * A body longer than {@link READ_MORE_LIMIT} characters is cut at the first
 * word boundary at or before the limit, so the preview never ends mid-word.
 * The cut is measured in code points, not UTF-16 units, so a body mixing
 * Persian with emoji still counts — and cuts — where the reader expects.
 */

export const READ_MORE_LIMIT = 256;

/** Marker appended to a `truncateAtWordBoundary` result. */
export const ELLIPSIS = "…";

/** One grapheme-ish unit: a base character plus any combining marks. */
const GRAPHEME = /[\s\S][\u0300-\u036f\u200c\u200d]*/g;

function splitGraphemes(value: string): string[] {
  return value.match(GRAPHEME) ?? [];
}

/** True when a preview is worth showing, i.e. the body would be cut. */
export function needsReadMore(body: string, limit = READ_MORE_LIMIT): boolean {
  return splitGraphemes(body).length > limit;
}

/**
 * Cuts `body` to at most `limit` units, backing up to the last whitespace so
 * the preview ends on a whole word. Falls back to a hard cut when the body is
 * one unbroken run (a URL, an unspaced sentence) so the preview is never empty.
 */
export function truncateAtWordBoundary(body: string, limit = READ_MORE_LIMIT): string {
  const units = splitGraphemes(body);
  if (units.length <= limit) return body;

  const window = units.slice(0, limit).join("");
  const lastBreak = window.search(/\s\S*$/);
  const cut = lastBreak > 0 ? window.slice(0, lastBreak) : window;

  return `${cut.replace(/\s+$/, "")}${ELLIPSIS}`;
}

/**
 * Length of the unfold/fold motion for a height change of `distance` pixels:
 * quick for a few extra lines, a little longer for a long post, never sluggish.
 */
export function readMoreDuration(distance: number): number {
  return Math.round(Math.min(420, Math.max(220, 180 + Math.max(0, distance) * 0.35)));
}
