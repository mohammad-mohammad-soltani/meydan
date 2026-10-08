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
  // Note: the backend's `Cache-Control` on the empty-query reply never reaches
  // the browser — every call here goes through app/api/meydan/[...path]/route.ts,
  // which rebuilds response headers and forwards only content-type/x-request-id
  // (true of every endpoint that sets `Response::cache`, not just this one). The
  // actual protection against request bursts is the server-side transient plus
  // the rate limit in ExploreController::hashtagSuggestions, not HTTP caching.
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
