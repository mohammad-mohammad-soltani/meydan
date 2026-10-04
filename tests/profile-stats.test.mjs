import assert from "node:assert/strict";
import test from "node:test";
import { availableProfileStats, narrativeTotal, upsertProfileStat } from "../features/profile/profile-stats.ts";

test("absent totals stay unknown while explicit zero remains zero", () => {
  for (const value of [undefined, null, "0", NaN, Infinity, -1]) assert.equal(narrativeTotal(value), null);
  assert.equal(narrativeTotal(0), 0);
  assert.equal(narrativeTotal(94), 94);
});

test("deferred narrative totals update their named stat without corrupting reflections", () => {
  const input = [{ label: "بازتاب رسانه‌ای", value: "۱۲ روایت", tone: "success" }, { label: "روایت منتشرشده", value: "۷" }];
  const output = upsertProfileStat(input, { label: "روایت منتشرشده", value: "۰" });
  assert.deepEqual(output, [{ label: "بازتاب رسانه‌ای", value: "۱۲ روایت", tone: "success" }, { label: "روایت منتشرشده", value: "۰" }]);
  assert.equal(input[1].value, "۷");
});

test("an omitted narrative stat is appended when its real total arrives", () => {
  const input = [{ label: "بازتاب رسانه‌ای", value: "۰ روایت", tone: "success" }];
  assert.deepEqual(upsertProfileStat(input, { label: "روایت منتشرشده", value: "۳" }), [...input, { label: "روایت منتشرشده", value: "۳" }]);
});

test("partial square metadata keeps a real reflection zero without inventing narrative zero", () => {
  assert.deepEqual(availableProfileStats(undefined, 0, String), [{ label: "بازتاب رسانه‌ای", value: "0 روایت", tone: "success" }]);
  assert.deepEqual(availableProfileStats(0, undefined, String), [{ label: "روایت منتشرشده", value: "0" }]);
  assert.deepEqual(availableProfileStats(undefined, undefined, String), []);
});
