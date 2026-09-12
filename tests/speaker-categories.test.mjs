import test from "node:test";
import assert from "node:assert/strict";

/**
 * The speaker filter is driven by admin-editable categories, so the client must
 * treat the slug as opaque and match on any of a speaker's several categories.
 */

const speakers = [
  { id: "1", categories: [{ slug: "siyasi", name: "سیاسی" }, { slug: "resanei", name: "رسانه‌ای" }] },
  { id: "2", categories: [{ slug: "eqtesadi", name: "اقتصادی" }] },
  { id: "3", categories: [] },
];

function filterSpeakers(list, filter) {
  return list.filter(
    (speaker) => filter === "all" || speaker.categories.some((category) => category.slug === filter),
  );
}

test("filters speakers by any of their categories", () => {
  assert.deepEqual(filterSpeakers(speakers, "siyasi").map((s) => s.id), ["1"]);
  assert.deepEqual(filterSpeakers(speakers, "resanei").map((s) => s.id), ["1"]);
  assert.deepEqual(filterSpeakers(speakers, "eqtesadi").map((s) => s.id), ["2"]);
});

test("all shows everyone, including uncategorized speakers", () => {
  assert.deepEqual(filterSpeakers(speakers, "all").map((s) => s.id), ["1", "2", "3"]);
});

test("an unknown category matches nobody instead of falling back to all", () => {
  assert.deepEqual(filterSpeakers(speakers, "bogus"), []);
});
