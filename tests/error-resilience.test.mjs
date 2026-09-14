import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("a broken optional widget cannot blank the whole route", () => {
  const boundaryPath = path.join(root, "components/shared/SilentBoundary.tsx");
  assert.ok(existsSync(boundaryPath), "SilentBoundary must exist");

  const boundary = source("components/shared/SilentBoundary.tsx");
  assert.match(boundary, /static getDerivedStateFromError/);
  assert.match(boundary, /componentDidCatch/);
  assert.match(boundary, /return this\.props\.fallback \?\? null/);

  const shell = source("components/layouts/AppShell.tsx");
  assert.match(shell, /<SilentBoundary label="trends-panel">[\s\S]*?<HotTrendsPanel \/>/);
  assert.match(shell, /<SilentBoundary label="mini-player">[\s\S]*?<MiniPlayer \/>/);
});

test("production errors stay reportable instead of a dead end", () => {
  const route = source("app/error.tsx");
  // The digest is what ties a user report to the matching server log line.
  assert.match(route, /error\.digest/);
  assert.match(route, /console\.error\("\[meydan\] route error"/);
  assert.match(route, /window\.location\.reload\(\)/);
  assert.match(route, /onClick=\{reset\}/);

  const globalError = source("app/global-error.tsx");
  assert.match(globalError, /<html lang="fa" dir="rtl">/);
  assert.match(globalError, /error\.digest/);
  assert.match(globalError, /onClick=\{reset\}/);
});

test("the home route survives feed API failures", () => {
  const home = source("app/(app)/home/page.tsx");
  assert.match(home, /Promise\.allSettled/);
  assert.match(home, /postsResult\.status === "fulfilled"/);
  assert.match(home, /suggestionsResult\.status === "fulfilled"/);
  assert.match(home, /\[meydan\] home feed request failed/);
  assert.match(home, /\[meydan\] home suggestions request failed/);
});

test("the trends feeds tolerate any payload shape", () => {
  const service = source("features/trends/services/trends.service.ts");
  // A backend answering with an object, a single row or null must not throw.
  assert.match(service, /function asList<T>\(value: unknown\): T\[\]/);
  assert.match(service, /const hotTrends = asList<ApiNarrative>\(hot\?\.items\)/);
  assert.match(service, /const items = asList<CuratedItem>\(data\?\.items\)/);
  assert.match(service, /return asList<ApiNarrative>\(data\)/);
  // The panel itself never throws into the route: state, not exceptions.
  assert.match(source("features/trends/components/HotTrendsPanel.tsx"), /setStatus\("error"\)/);
});
