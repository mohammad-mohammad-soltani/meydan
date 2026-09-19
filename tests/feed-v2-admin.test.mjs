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
