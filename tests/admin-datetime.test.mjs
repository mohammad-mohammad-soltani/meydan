import assert from "node:assert/strict";
import test from "node:test";

import {
  formatAdminDate,
  formatAdminDateTime,
  splitAdminDateTime,
  joinAdminDateTime,
} from "../features/admin/lib/datetime.ts";

test("a Gregorian date-only value is shown as a Jalali day without timezone drift", () => {
  assert.equal(formatAdminDate("2025-03-21"), "۱ فروردین ۱۴۰۴");
  assert.equal(formatAdminDate("2025-03-21 00:00:00"), "۱ فروردین ۱۴۰۴");
});

test("UTC instants are shown in Tehran while naive datetimes keep their wall time", () => {
  assert.equal(formatAdminDateTime("2025-03-20T22:00:00Z"), "۱ فروردین ۱۴۰۴، ۰۱:۳۰");
  assert.equal(formatAdminDateTime("2025-03-21 09:15:00"), "۱ فروردین ۱۴۰۴، ۰۹:۱۵");
});

test("picker date and time round-trip through the existing Gregorian API format", () => {
  assert.deepEqual(splitAdminDateTime("2025-03-21T09:15"), {
    date: "2025-03-21",
    time: "09:15",
  });
  assert.deepEqual(splitAdminDateTime("2025-03-21 09:15:00"), {
    date: "2025-03-21",
    time: "09:15",
  });
  assert.equal(joinAdminDateTime("2025-03-21", "09:15"), "2025-03-21 09:15");
});

test("blank or invalid values are not rendered as a fake date", () => {
  assert.equal(formatAdminDate(""), "—");
  assert.equal(formatAdminDate("2025-02-31"), "—");
  assert.equal(formatAdminDateTime("not-a-date"), "—");
  assert.deepEqual(splitAdminDateTime("not-a-date"), { date: "", time: "" });
});
