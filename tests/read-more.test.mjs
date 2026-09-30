import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

async function loadReadMore() {
  const file = path.join(root, "features/feed/read-more.ts");
  assert.ok(existsSync(file), "features/feed/read-more.ts must exist");
  return import(pathToFileURL(file).href);
}

const persianWord = (length) => "ا".repeat(length);

test("short posts are not truncated at all", async () => {
  const { needsReadMore, truncateAtWordBoundary, READ_MORE_LIMIT } = await loadReadMore();

  const short = persianWord(READ_MORE_LIMIT);
  assert.equal(needsReadMore(short), false, "exactly at the limit still fits");
  assert.equal(truncateAtWordBoundary(short), short);

  const tiny = "یک روایت کوتاه";
  assert.equal(needsReadMore(tiny), false);
  assert.equal(truncateAtWordBoundary(tiny), tiny);
});

test("long posts are cut at a word boundary, never mid-word", async () => {
  const { truncateAtWordBoundary, needsReadMore, ELLIPSIS, READ_MORE_LIMIT } = await loadReadMore();

  // 400 single-character words: the limit lands in the middle of word 257.
  const words = Array.from({ length: 400 }, (_, index) => `w${index}`);
  const body = words.join(" ");
  assert.equal(needsReadMore(body), true);

  const preview = truncateAtWordBoundary(body);
  assert.ok(preview.endsWith(ELLIPSIS), "a truncated preview is marked as such");

  const shown = preview.slice(0, -ELLIPSIS.length);
  // The cut must not leave a partial word behind.
  const lastWord = shown.split(" ").at(-1);
  assert.ok(words.includes(lastWord), `"${lastWord}" must be a whole word`);
  assert.ok(shown.length <= READ_MORE_LIMIT, "the preview stays within the limit");
  assert.ok(body.startsWith(shown), "the preview is a real prefix of the body");
});

test("the limit is measured in code points, so emoji do not cut in half", async () => {
  const { truncateAtWordBoundary, needsReadMore, ELLIPSIS } = await loadReadMore();

  // Long enough to truncate, with emoji straddling the 256-unit boundary.
  const body = `${"خبر ".repeat(70)}${"🎬".repeat(20)} پایان روایت`;
  assert.equal(needsReadMore(body), true);

  const preview = truncateAtWordBoundary(body);
  assert.ok(preview.endsWith(ELLIPSIS), "a long body is cut");

  // A surrogate pair split by a naive slice would leave a lone half here.
  assert.ok(!/[\uD800-\uDBFF]$/.test(preview), "the preview must not end on a broken emoji");
  assert.ok(!preview.includes("\uFFFD"), "no replacement characters anywhere");
});

test("a body with no spaces still yields a bounded preview", async () => {
  const { truncateAtWordBoundary, needsReadMore, READ_MORE_LIMIT, ELLIPSIS } = await loadReadMore();

  const url = `https://example.com/${"a".repeat(500)}`;
  assert.equal(needsReadMore(url), true);

  const preview = truncateAtWordBoundary(url);
  assert.equal(preview, `${url.slice(0, READ_MORE_LIMIT)}${ELLIPSIS}`);
});

test("the read more control reveals the rest in place", () => {
  const component = source("features/feed/components/ReadMoreText.tsx");

  // Folding and unfolding is local state: the card must not navigate away.
  assert.match(component, /useState\(false\)/);
  assert.match(component, /setIsExpanded\(\(value\) => !value\)/);
  assert.match(component, /خواندن بیشتر/);
  assert.match(component, /خواندن کمتر/);

  // The toggle has to beat the full-card link that wraps the timeline card.
  assert.match(component, /event\.preventDefault\(\)/);
  assert.match(component, /event\.stopPropagation\(\)/);

  // Accessible disclosure semantics.
  assert.match(component, /aria-expanded=\{isExpanded\}/);
  assert.match(component, /aria-controls=\{bodyId\}/);
  assert.match(component, /useId\(\)/);

  // The hidden remainder is revealed with the shared animation utility.
  assert.match(component, /read-more-reveal-open/);
});

test("the reveal animation respects reduced motion", () => {
  const css = (source("app/globals.css") + source("features/admin/admin-workspace.css") + source("features/media/viewer.css"));

  assert.match(css, /@keyframes read-more-reveal-keyframes/);
  assert.match(css, /@utility read-more-reveal-open/);
  // `.read-more-reveal` keeps the hidden remainder out of layout entirely.
  assert.match(css, /@utility read-more-reveal \{\s*display: none;/);

  // The global reduced-motion block collapses every animation duration, so the
  // reveal must be covered by it rather than opting out with its own rule.
  const reducedMotion = css.slice(css.indexOf("prefers-reduced-motion"));
  assert.match(reducedMotion, /animation-duration: 0\.01ms !important/);
});

test("both post layouts fold their long bodies", () => {
  const card = source("features/feed/components/PostCard.tsx");

  // Timeline and detail both render the shared control, and neither still
  // prints the raw body as text.
  const usages = card.match(/<ReadMoreText/g) ?? [];
  assert.equal(usages.length, 2, "timeline and detail must both use ReadMoreText");
  assert.doesNotMatch(card, />\s*\{post\.body\}\s*</, "no layout may still print the raw body");
});
