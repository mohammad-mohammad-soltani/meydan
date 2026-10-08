/** Shared helpers for turning a hashtag into (and back out of) its explore link. */

import { meydanApi } from "@/lib/meydan-api";

export const HASHTAG_LINK_PREFIX = "/explore?q=%23";

export type HashtagSuggestion = { tag: string; count: number };

/**
 * The composer's `#` autocomplete: tags starting with `prefix` (no leading
 * `#`), busiest first; an empty prefix returns the current hot tags.
 */
export async function getHashtagSuggestions(
  prefix: string,
  signal?: AbortSignal,
): Promise<HashtagSuggestion[]> {
  const q = prefix.replace(/^#/, "").trim();
  const data = await meydanApi<{ items?: HashtagSuggestion[] }>(
    `/explore/hashtags?q=${encodeURIComponent(q)}`,
    { signal, suppressAuthRedirect: true },
  );
  return data?.items ?? [];
}

/** `#برچسب` -> `/explore?q=%23برچسب`, so the explore page's search picks it up as-is. */
export function hashtagHref(tag: string): string {
  return `/explore?q=${encodeURIComponent(`#${tag}`)}`;
}

/** True for an href this module produced, so renderers can style it as a hashtag. */
export function isHashtagHref(href: string): boolean {
  return href.startsWith(HASHTAG_LINK_PREFIX);
}
