import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("Feed V2 admin services use the existing authenticated admin transport", () => {
  const settings = source("features/admin/lib/feed-settings.ts");
  const service = source("features/admin/services/feed.service.ts");
  const server = source("features/admin/services/admin-server.ts");

  assert.match(settings, /maxEngagementScore/);
  assert.match(settings, /validateFeedSettings/);
  assert.match(service, /adminPut<AdminFeedSettingsResponse>/);
  assert.match(service, /\/admin\/feed\/settings/);
  assert.match(service, /\/admin\/feed\/preview/);
  assert.match(server, /getFeedSettingsRaw\(await withAdminAuth\(\)\)/);
});

test("Feed V2 frontend maps settings only and contains no ranking logic", () => {
  const service = source("features/admin/services/feed.service.ts");
  const settings = source("features/admin/lib/feed-settings.ts");

  assert.doesNotMatch(service, /log1p|final_score/i);
  assert.doesNotMatch(settings, /log1p|final_score/i);
  assert.match(service, /feedSettingsBody/);
});

test("Feed V2 has an administrator-only grouped configuration screen", () => {
  const nav = source("features/admin/components/AdminSectionNav.tsx");
  const page = source("app/(app)/admin/feed/page.tsx");
  const view = source("features/admin/components/AdminFeedSettingsView.tsx");

  assert.match(nav, /href: "\/admin\/feed", label: "فید"/);
  assert.match(page, /if \(!\(await isAdministrator\(\)\)\) return null/);
  for (const group of ["تعامل کاربران", "نقش کاربران", "محتوای ویژه", "موقعیت مکانی", "تازگی محتوا", "ایندکسینگ", "Diversity", "Candidate Generation"]) {
    assert.match(view, new RegExp(group));
  }
  assert.match(view, /previewFeed/);
  assert.doesNotMatch(view, /["'`]\/timeline/);
  assert.doesNotMatch(view, /getTimeline|incrementViewsBulk|recordServed/);
});
