import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { profilePrefetchIndex } from "../features/profile/profile-pagination.ts";

const frontend = path.resolve(import.meta.dirname, "..");
const source = (root, file) => readFileSync(path.join(root, file), "utf8");

test("own and public profiles preserve the first cursor and request older pages", () => {
  const service = source(frontend, "features/profile/services/profile.service.ts");
  const hook = source(frontend, "features/profile/hooks/useProfile.ts");
  const activity = source(frontend, "features/profile/components/ProfileActivity.tsx");
  assert.match(service, /meydanApiPage<ApiNarrative\[\]>/);
  assert.match(service, /nextNarrativeCursor/);
  assert.match(service, /export async function getProfileNarrativePage/);
  assert.match(hook, /fetch\("\/api\/profile\/narratives"/);
  assert.match(source(frontend, "app/api/profile/narratives/route.ts"), /getProfileNarrativePage/);
  assert.match(hook, /setNarrativePosts\(\(current\)/);
  assert.match(activity, /useInfiniteScroll\(\{/);
  assert.match(activity, /ref=\{sentinelRef\}/);
  assert.match(activity, /تلاش دوباره/);
});

test("the next profile page starts loading halfway through each newly added chunk", () => {
  assert.equal(profilePrefetchIndex(20, 0), 10);
  assert.equal(profilePrefetchIndex(40, 20), 30);
  assert.equal(profilePrefetchIndex(9, 6), 8);
  // A media page with no matching items keeps its trigger after the visible list.
  assert.equal(profilePrefetchIndex(6, 6), 6);

  const activity = source(frontend, "features/profile/components/ProfileActivity.tsx");
  assert.match(activity, /rootMargin: "0px"/);
  assert.match(activity, /index \+ 1 === prefetchIndex/);
});
