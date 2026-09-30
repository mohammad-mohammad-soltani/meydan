import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("the shell reserves the comment composer's height", () => {
  // The composer publishes how much room it needs...
  const composer = source("features/posts/components/CommentInput.tsx");
  assert.match(composer, /--comment-composer-height/);
  assert.match(composer, /new ResizeObserver\(updateHeight\)/);
  assert.match(composer, /removeProperty\(\s*"--comment-composer-height"/);

  // ...and the app column reserves exactly that at the bottom, so the global
  // audio player docks above the composer instead of behind it.
  const shell = source("components/layouts/AppShell.tsx");
  assert.match(
    shell,
    /id="mainAppShell"[\s\S]*?pb-\[var\(--comment-composer-height\)\]/,
    "the shell must reserve the composer height",
  );

  // The token has a neutral default for every other route.
  assert.match((source("app/globals.css") + source("features/admin/admin-workspace.css") + source("features/media/viewer.css")), /--comment-composer-height: 0px/);
});

test("the post comment list no longer double-reserves that space", () => {
  const list = source("features/posts/components/CommentsList.tsx");
  assert.doesNotMatch(list, /pb-40/);
  assert.match(list, /pb-8/);
});
