import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("a valid refresh cookie restores an expired protected-route session", () => {
  const proxy = source("proxy.ts");
  const session = source("lib/meydan-session.ts");

  assert.match(session, /ACCESS_EXPIRY_COOKIE/);
  assert.match(session, /SESSION_COOKIE_MAX_AGE/);
  assert.match(proxy, /refreshSession/);
  assert.match(proxy, /REFRESH_COOKIE/);
  assert.match(proxy, /ACCESS_EXPIRY_COOKIE/);
  assert.match(proxy, /request:\s*\{\s*headers: requestHeaders\s*\}/);
});

test("permission failures do not turn into a client logout", () => {
  const api = source("lib/meydan-api.ts");

  assert.match(api, /reason\.status === 401;/);
  assert.doesNotMatch(api, /response\.status === 401 \|\| response\.status === 403/);
});

test("API refresh writes a persistent access cookie and its expiry marker", () => {
  const route = source("app/api/meydan/[...path]/route.ts");

  assert.match(route, /SESSION_COOKIE_MAX_AGE/);
  assert.match(route, /ACCESS_EXPIRY_COOKIE/);
  assert.doesNotMatch(route, /maxAge: 15 \* 60/);
  assert.doesNotMatch(route, /result\.cookies\.delete\(ACCESS_COOKIE\)/);
});
