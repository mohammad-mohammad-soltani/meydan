import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("profile header always describes the published narrative count", () => {
  const header = source("features/profile/components/ProfileHeader.tsx");

  assert.match(header, /\{postLabel\} روایت منتشر شده/);
  assert.doesNotMatch(header, /const postCounts = stats\[0\]\.value/);
});

test("square profile stats no longer include continuous gathering nights", () => {
  const profileService = source("features/profile/services/profile.service.ts");
  const squareMetaService = source(
    "features/profile/services/square-profile-meta.service.ts",
  );

  assert.doesNotMatch(profileService, /تجمع مستمر/);
  assert.doesNotMatch(squareMetaService, /تجمع مستمر/);
});

test("square profile editing no longer exposes or submits a start date", () => {
  const editor = source("features/profile/components/ProfileEditView.tsx");

  assert.doesNotMatch(editor, /تاریخ شروع فعالیت میدان/);
  assert.doesNotMatch(editor, /start_date:/);
  assert.doesNotMatch(editor, /PersianDatePicker/);
});
