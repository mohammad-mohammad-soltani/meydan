import assert from "node:assert/strict";
import test from "node:test";

import { parseAuthUpstreamPayload } from "../lib/auth-upstream.ts";

test("auth proxy parses a normal Meydan response envelope", () => {
  const payload = { data: { authenticated: true, access_token: "acc_test" } };
  assert.deepEqual(parseAuthUpstreamPayload(JSON.stringify(payload)), payload);
});

test("auth proxy recovers a valid JSON envelope polluted by upstream output", () => {
  const payload = { data: { authenticated: true, access_token: "acc_test" } };
  assert.deepEqual(parseAuthUpstreamPayload(`PHP warning\n${JSON.stringify(payload)}\n`), payload);
});

test("auth proxy accepts a UTF-8 BOM before the response", () => {
  const payload = { error: { message: "invalid code" } };
  assert.deepEqual(parseAuthUpstreamPayload(`\uFEFF${JSON.stringify(payload)}`), payload);
});

test("auth proxy rejects unrelated JSON embedded in an invalid response", () => {
  assert.equal(parseAuthUpstreamPayload('<script>{"debug":true}</script>'), null);
});
