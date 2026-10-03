import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("the trends service reads the cached explore tags first and degrades safely", () => {
  const service = source("features/trends/services/trends.service.ts");
  // One cached read shared with the explore page; the old curated /trends/hot route never existed.
  assert.match(service, /"\/explore\/home"/);
  assert.doesNotMatch(service, /\/trends\/hot/);
  assert.match(service, /\/explore\/trends\?window=\$\{TREND_WINDOW\}/);
  assert.match(service, /\/timeline\?mode=for_you&filter=all/);
  assert.match(service, /engagementScore/);
  assert.match(service, /signal/);
  const types = source("features/trends/types.ts");
  for (const field of ["rank", "context", "title", "metric", "href"]) {
    assert.match(types, new RegExp(`\\b${field}[?]?:`), `HotTrend must expose ${field}`);
  }
});

test("the sidebar panel owns its loading, empty, error and ready states", () => {
  const panel = source("features/trends/components/HotTrendsPanel.tsx");
  assert.match(panel, /from "\.\.\/services\/trends\.service"/);
  assert.match(panel, /useIsDesktop/);
  assert.match(panel, /if \(!isDesktop\) return;/);
  assert.match(panel, /type Status = "loading" \| "ready" \| "error"/);
  assert.match(panel, /aria-busy/);
  assert.match(panel, /ترندهای داغ میادین/);
  assert.match(panel, /هنوز ترندی در ۲۴ ساعت گذشته ثبت نشده است/);
  assert.match(panel, /تلاش دوباره/);
  // Reference design: a bordered header row, then title, metric and a chevron per trend.
  assert.match(panel, /border-b border-divider pb-3/);
  assert.match(panel, /trend\.metric/);
  assert.match(panel, /ChevronLeft/);
});

test("the desktop breakpoint hook matches Tailwind's lg and is hydration safe", () => {
  const hook = source("components/layouts/useIsDesktop.ts");
  assert.match(hook, /\(min-width: 64rem\)/);
  assert.match(hook, /useSyncExternalStore/);
  assert.match(hook, /matchMedia/);
  // Server snapshot must be false so SSR and hydration agree.
  assert.match(hook, /\(\) => false/);
});

test("AppShell mounts the trends panel in the desktop-only left column", () => {
  const shell = source("components/layouts/AppShell.tsx");
  assert.match(shell, /import \{ HotTrendsPanel \} from "@\/features\/trends\/components\/HotTrendsPanel"/);
  assert.match(
    shell,
    /<aside className="hidden h-screen w-72[\s\S]*?<HotTrendsPanel \/>[\s\S]*?<\/aside>/,
    "the panel must render inside the left sidebar aside",
  );
  // The old placeholder copy is gone.
  assert.doesNotMatch(shell, /نمای مشترک اطلاعات و روندهای میدانی/);
});

test("the backend handoff prompt documents the exact contract", () => {
  const promptsDir = path.join(root, "docs/backend-prompts");
  assert.ok(existsSync(promptsDir), "docs/backend-prompts must exist");
  const prompt = source("docs/backend-prompts/2026-09-13-hot-trends-api.md");
  assert.match(prompt, /GET \/wp-json\/meydan\/v1\/trends\/hot/);
  for (const field of ["rank", "kind", "context", "title", "href"]) {
    assert.match(prompt, new RegExp(`\`${field}\``), `prompt must define ${field}`);
  }
  assert.match(prompt, /`metric\.value`/);
  assert.match(prompt, /`metric\.label`/);
  assert.match(prompt, /"items": \[\]/);
  assert.match(prompt, /window=ever/);
});
