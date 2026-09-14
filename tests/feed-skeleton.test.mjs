import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("home and feed use skeletons while data is unavailable", () => {
  assert.ok(existsSync(path.join(root, "app/(app)/home/loading.tsx")));
  assert.ok(existsSync(path.join(root, "features/feed/components/FeedSkeleton.tsx")));

  const home = source("app/(app)/home/page.tsx");
  assert.match(home, /postsUnavailable/);
  assert.match(home, /suggestionsUnavailable/);

  const feed = source("features/feed/components/FeedView.tsx");
  assert.match(feed, /FeedSkeleton/);
  assert.match(feed, /showForYouSkeleton/);
  assert.match(feed, /feed\.isLoading/);

  const following = source("features/feed/components/FollowingEmptyState.tsx");
  assert.match(following, /return <FeedSkeleton items=\{2\} \/>/);
  assert.doesNotMatch(following, /LoaderCircle/);
});
