import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("post detail exposes deletion only when the API grants permission", () => {
  const detail = source("features/posts/components/PostView.tsx");
  const service = source("features/posts/services/posts.service.ts");

  assert.match(service, /can_delete\?: boolean/);
  assert.match(service, /canDelete:\s*Boolean\(post\.viewer_state\?\.can_delete\)/);
  assert.match(detail, /viewerState:\s*\{[\s\S]*canDelete:/);
  assert.match(detail, /onDelete=/);
});

test("post deletion uses the application dialog instead of browser confirm", () => {
  const feed = source("features/feed/components/FeedView.tsx");
  const detail = source("features/posts/components/PostView.tsx");
  const dialog = source("features/feed/components/DeletePostDialog.tsx");

  assert.doesNotMatch(feed, /window\.confirm/);
  assert.match(feed, /<DeletePostDialog/);
  assert.match(detail, /<DeletePostDialog/);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /حذف روایت/);
  assert.match(dialog, /انصراف/);
});
