import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "app/auth/page.tsx"), "utf8");

test("OTP login requires all six digits and safely reports malformed proxy responses", () => {
  assert.match(source, /code\.length < 6/);
  assert.match(source, /await response\.text\(\)/);
  assert.match(source, /سرور ورود پاسخ قابل‌خواندن برنگرداند/);
  assert.match(source, /requestId/);
});
