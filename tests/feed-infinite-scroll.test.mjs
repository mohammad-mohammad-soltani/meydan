import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("the api client keeps the timeline's next cursor instead of dropping it", () => {
  const api = source("lib/meydan-api.ts");

  assert.match(api, /export type ApiPage<T> = \{/);
  assert.match(api, /export async function meydanApiPage<T>/);
  assert.match(api, /next_cursor/);
  // Every other caller keeps the payload-only helper.
  assert.match(api, /export async function meydanApi<T>[\s\S]*?meydanApiPage<T>\(path, init\)\)\.data/);
});

test("Feed V2 keeps the existing public timeline endpoint", () => {
  const service = source("features/feed/services/feed.service.ts");

  assert.match(service, /\/timeline/);
  assert.doesNotMatch(service, /feed\/for-you/);
});

test("the timeline service asks for a page and returns its cursor", () => {
  const service = source("features/feed/services/feed.service.ts");

  assert.match(service, /export const FEED_PAGE_SIZE = \d+/);
  // The backend only issues `next_cursor` when an explicit limit narrows the page.
  assert.match(service, /limit: String\(query\.limit \?\? FEED_PAGE_SIZE\)/);
  assert.match(service, /if \(query\.cursor\) params\.set\("cursor", query\.cursor\)/);
  assert.match(service, /meydanApiPage<ApiNarrative\[\]>/);
  assert.match(service, /export type FeedPage = \{[\s\S]*?nextCursor: string \| null/);
});

test("the feed hook pages the timeline instead of fetching it once", () => {
  const feed = source("features/feed/hooks/useFeed.ts");

  assert.match(feed, /getFeedPage/);
  // A follow-up page is requested with the cursor the previous page returned.
  assert.match(feed, /cursor,/);
  assert.match(feed, /hasMore: nextCursor !== null/);
  assert.match(feed, /isLoadingMore/);
  assert.match(feed, /loadMoreFailed/);
  // Appended pages must not repeat a card already on screen.
  assert.match(feed, /knownPostIdsRef/);
  assert.match(feed, /filter\(\(post\) => !knownPostIdsRef\.current\.has\(post\.id\)\)/);
  // A late page from a previous tab or filter must never be appended.
  assert.match(feed, /generationRef/);
});

test("an offset page that only repeats the timeline is skipped, not treated as the end", () => {
  const feed = source("features/feed/hooks/useFeed.ts");

  // The for-you feed is ranked per request, so offsets can overlap.
  assert.match(feed, /const MAX_SKIPPED_PAGES = \d+;/);
  assert.match(feed, /skipped <= MAX_SKIPPED_PAGES/);
  assert.match(feed, /if \(!freshPosts\.length\) continue;/);
  // One visible page per trigger, and the cursor after the page it consumed.
  assert.match(feed, /break;/);
});

test("the home page hands the first cursor to the client feed", () => {
  const home = source("app/(app)/home/page.tsx");

  assert.match(home, /getFeedPage\(\)/);
  assert.match(home, /nextCursor=\{feedPage\.nextCursor\}/);

  const view = source("features/feed/components/FeedView.tsx");
  assert.match(view, /nextCursor\?: string \| null/);
  assert.match(view, /useFeed\(posts, suggestions, nextCursor\)/);
});

test("reaching the end of the list loads the next timeline page", () => {
  const scroll = source("features/feed/hooks/useInfiniteScroll.ts");

  assert.match(scroll, /new IntersectionObserver/);
  // The feed scrolls inside the app shell, not the window.
  assert.match(scroll, /findScrollParent/);
  assert.match(scroll, /root: findScrollParent\(sentinel\)/);

  const view = source("features/feed/components/FeedView.tsx");
  assert.match(view, /useInfiniteScroll\(\{/);
  assert.match(view, /onLoadMore: feed\.loadMore/);
  assert.match(view, /ref=\{sentinelRef\}/);
  // The manual control keeps the list usable without IntersectionObserver and
  // gives a failed page a way back.
  assert.match(view, /onClick=\{feed\.loadMore\}/);
  assert.match(view, /بارگذاری بیشتر/);
  assert.match(view, /تلاش دوباره/);
});
