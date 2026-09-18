import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("proxy refreshes a stale session on public pages without redirecting guests", () => {
  const proxy = source("proxy.ts");

  assert.match(proxy, /const isProtected = isProtectedPath\(pathname\)/);
  assert.match(proxy, /if \(refreshed\)/);
  assert.match(proxy, /if \(accessToken \|\| !isProtected\) return NextResponse\.next\(\)/);
  assert.doesNotMatch(proxy, /if \(!isProtectedPath\(pathname\)\) return NextResponse\.next\(\)/);

  // Proxy must run for document requests such as / and /home, while avoiding
  // API handlers and static assets that have their own request lifecycle.
  assert.ok(
    proxy.includes('"/((?!api|_next/static|_next/image|.*\\\\.[^.]+$).*)",'),
    "proxy matcher must cover public document requests while excluding assets",
  );
});

test("the public feed does not ask for viewer state as a guest", () => {
  const feed = source("features/feed/hooks/useFeed.ts");

  assert.match(feed, /const \{ isAuthenticated, requireAuth \} = useAuthGate\(\)/);
  assert.match(feed, /useState\(\(\) => !isAuthenticated\)/);
  assert.match(feed, /if \(!isAuthenticated\) return;/);
});
