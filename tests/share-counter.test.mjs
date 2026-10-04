import assert from "node:assert/strict";
import test from "node:test";
import { createShareCounter } from "../features/share/share-counter.ts";

test("confirmed share analytics coalesce concurrent actions and record once", async () => {
  let calls = 0;
  let finish;
  const count = createShareCounter(() => { calls += 1; return new Promise((resolve) => { finish = resolve; }); });
  const first = count();
  const second = count();
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  finish({ shared: true });
  assert.equal(await first, true);
  assert.equal(await count(), true);
  assert.equal(calls, 1);
});

test("a failed analytics write does not pretend confirmation and retries on next share", async () => {
  let calls = 0;
  const count = createShareCounter(async () => {
    calls += 1;
    if (calls === 1) throw new Error("connection lost");
    return { shared: true };
  });
  assert.equal(await count(), false);
  assert.equal(await count(), true);
  assert.equal(await count(), true);
  assert.equal(calls, 2);
});
