import assert from "node:assert/strict";
import test from "node:test";

import { suggestedContentTitle } from "../features/posts/services/content-title.ts";

test("suggests the first non-empty narrative line without emoji", () => {
  assert.equal(
    suggestedContentTitle("\n\n🔥 سلام دنیا 😍\nبدنه روایت"),
    "سلام دنیا",
  );
});

test("keeps ordinary Persian text while removing emoji and extra spaces", () => {
  assert.equal(
    suggestedContentTitle("  روایتِ امروز ✨ دربارهٔ ایران\nمتن بعدی"),
    "روایتِ امروز دربارهٔ ایران",
  );
});

test("uses a stable fallback when the first line contains only emoji", () => {
  assert.equal(suggestedContentTitle("🔥✨\nمتن روایت", 42), "محتوا از روایت #42");
});
