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

test("OTP autofill accepts a full SMS code in the first digit field", () => {
  assert.match(source, /const normalized = toLatinDigits\(nextValue\)\.replace\(\/\\D\/g, ""\)\.slice\(0, 6\)/);
  assert.match(source, /if \(normalized\.length > 1\) \{[\s\S]*onChange\(normalized\)/);
  assert.match(source, /autoComplete=\{index === 0 \? "one-time-code" : "off"\}/);
  assert.match(source, /maxLength=\{index === 0 \? 6 : 1\}/);
  assert.match(source, /onAutofill\?\.\(normalized\)/);
  assert.match(source, /onAutofill=\{\(autoFilledCode\) => void verifyCode\(autoFilledCode\)\}/);
});
