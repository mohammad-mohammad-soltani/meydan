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

  // Unfolding animates the height down to the last line with a fading edge.
  assert.match(component, /element\.animate\(/);
  assert.match(component, /maskImage/);
});

test("the reveal animation is quick and respects reduced motion", async () => {
  const { readMoreDuration } = await loadReadMore();
  const component = source("features/feed/components/ReadMoreText.tsx");

  assert.equal(readMoreDuration(0), 220, "a couple of lines still animate visibly");
  assert.equal(readMoreDuration(10_000), 420, "a very long post never drags");
  assert.ok(readMoreDuration(200) > readMoreDuration(40), "longer reveals take a little longer");
  assert.match(component, /prefers-reduced-motion: reduce/);
});

test("the timeline folds long bodies while the post page shows them in full", () => {
  const card = source("features/feed/components/PostCard.tsx");

  // Only the timeline folds; the post page renders the whole body, and
  // neither still prints the raw body as text.
  const usages = card.match(/<ReadMoreText/g) ?? [];
  assert.equal(usages.length, 1, "only the timeline uses ReadMoreText");
  assert.match(card, /<MarkdownText\s+body=\{post\.body\}/);
  assert.doesNotMatch(card, />\s*\{post\.body\}\s*</, "no layout may still print the raw body");
});
