import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SESSION_MAX_AGE } from "../lib/meydan-session-config.ts";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

test("session cookie max age is 30 days", () => {
  assert.equal(SESSION_MAX_AGE, THIRTY_DAYS);
});

test("auth and generic API proxies use the shared 30 day session max age", async () => {
  const [authRoute, apiRoute] = await Promise.all([
    readFile(new URL("../app/api/auth/[action]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/meydan/[...path]/route.ts", import.meta.url), "utf8"),
  ]);

  for (const source of [authRoute, apiRoute]) {
    assert.match(source, /SESSION_MAX_AGE/);
    assert.doesNotMatch(source, /15\s*\*\s*60/);
  }
});
