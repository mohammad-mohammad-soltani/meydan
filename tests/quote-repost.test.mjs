import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mapQuotedNarrative } from "../features/feed/services/quote-mapper.ts";
import { quoteComposeHref, repostTotal } from "../features/feed/post-counts.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("a post that quotes nothing maps to no quote", () => {
  assert.equal(mapQuotedNarrative(undefined), undefined);
  assert.equal(mapQuotedNarrative(null), undefined);
});

test("a deleted or hidden quoted post becomes an unavailable stub", () => {
  assert.deepEqual(mapQuotedNarrative({ id: 12, unavailable: true }), { id: "12", unavailable: true });
});

test("the quoted post keeps its author, text and attachments", () => {
  const quote = mapQuotedNarrative({
    id: 7,
    unavailable: false,
    author: { id: "sq_42", type: "square", display_name: "میدان آزادی", verified: true },
    body: "<p>سلام</p>",
    published_at: new Date().toISOString(),
    attachments: [
      { id: 1, type: "video", url: "/v.mp4", poster_url: "/p.jpg" },
      { id: 2, type: "audio", url: "/a.mp3" },
    ],
  });

  assert.equal(quote.id, "7");
  assert.equal(quote.unavailable, false);
  assert.equal(quote.author.id, 42);
  assert.equal(quote.author.type, "square");
  assert.equal(quote.author.verified, true);
  assert.equal(quote.body, "سلام");
  assert.equal(quote.attachments[0].icon, "video");
  assert.equal(quote.attachments[0].posterSrc, "/p.jpg");
  assert.equal(quote.attachments[1].audioSrc, "/a.mp3");
});

test("the repost button counts reposts and quotes together", () => {
  assert.equal(repostTotal({ reposts: 3, quotes: 2 }), 5);
  assert.equal(repostTotal({ reposts: 3 }), 3);
  assert.equal(quoteComposeHref("15"), "/compose?quote=15");
});

test("share ends the action bar on timeline cards (reference design) and the header on the post page", () => {
  const card = source("features/feed/components/PostCard.tsx");
  const actions = source("features/feed/components/PostActions.tsx");

  // Post page header keeps its share button; the timeline passes onShare to the bar.
  assert.match(card, /<PostShareButton onShare=\{onShare\}/);
  assert.match(card, /onShare=\{onShare\}\n\s*bookmarked=\{Boolean\(post\.viewerState\?\.bookmarked\)\}\n\s*\/> : null\}/);
  assert.match(actions, /Share2/);
  assert.match(actions, /اشتراک/);
  assert.match(actions, /<RepostMenu/);
  assert.match(actions, /quoteComposeHref\(postId\)/);
  assert.match(card, /<QuotedPostCard quote=\{post\.quote\}/);
});

test("the repost menu offers repost, undo and quote from a portaled sheet", () => {
  const menu = source("features/feed/components/RepostMenu.tsx");

  assert.match(menu, /createPortal/);
  assert.match(menu, /لغو بازنشر/);
  assert.doesNotMatch(menu, /انصراف/);
  assert.match(menu, /نقل‌قول/);
  assert.match(menu, /onRepost/);
  assert.match(menu, /onQuote/);
});

test("the composer publishes a quote with the quoted narrative id", () => {
  const compose = source("features/compose/components/ComposeView.tsx");
  const page = source("app/(app)/compose/page.tsx");

  assert.match(compose, /quoted_narrative_id:\s*Number\(quoteId\)/);
  // The optional title (reference design: «+ افزودن عنوان») never shows on a quote.
  assert.match(compose, /\{!quoteId && showTitle \? <input ref=\{titleRef\}/);
  assert.match(page, /\\d\{1,12\}/);
});

test("repost state is wired through every surface that renders a post", () => {
  assert.match(source("features/feed/hooks/useFeed.ts"), /adjustRepostCount/);
  assert.match(source("features/profile/hooks/useProfile.ts"), /toggleRepost/);
  assert.match(source("features/profile/components/ProfileActivity.tsx"), /onRepost=\{\(\) => onRepost\(post\.id\)\}/);
  assert.match(source("features/posts/hooks/usePost.ts"), /Math\.max\(0, current\.reposts \+ delta\)/);
  assert.match(source("features/media/components/ImmersivePostSlide.tsx"), /<RepostMenu/);
});

test("the post page links to a separate quotes page instead of listing quotes inline", () => {
  const view = source("features/posts/components/PostView.tsx");
  assert.match(view, /\/posts\/\$\{state\.post\.id\}\/quotes/);
  assert.match(view, /مشاهده نقل‌قول‌ها/);
  assert.doesNotMatch(view, /QuotesList/);
  assert.match(source("app/(app)/posts/[postId]/quotes/page.tsx"), /getQuotesPage/);
});
