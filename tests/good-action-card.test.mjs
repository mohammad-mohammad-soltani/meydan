import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("the good-action card stacks on phones and stays one row on wider screens", () => {
  const card = source("features/feed/components/ConnectedGoodActionCard.tsx");

  // Mobile first: icon + text on top, the join action on its own full-width row.
  assert.match(card, /flex flex-col gap-3 sm:flex-row sm:items-center/);
  assert.match(card, /min-h-11 w-full shrink-0[\s\S]*?sm:min-h-10 sm:w-auto/);

  // The meta line may never squeeze; it wraps instead of jumbling.
  assert.match(card, /flex flex-wrap items-center gap-x-1\.5 gap-y-0\.5/);
  assert.match(card, /tabular-nums/);
  assert.match(card, /whitespace-nowrap/);
});

test("the timeline card can actually receive the tap", () => {
  const card = source("features/feed/components/ConnectedGoodActionCard.tsx");
  // PostCard's timeline body is pointer-events-none behind a full-card link.
  assert.match(card, /pointer-events-auto relative z-10/);
  assert.match(card, /aria-pressed=\{joined\}/);
});

test("a solid warning fill always carries a readable label", () => {
  const card = source("features/feed/components/ConnectedGoodActionCard.tsx");
  assert.match(card, /bg-warning text-warning-solid-foreground/);
  assert.doesNotMatch(card, /bg-warning text-on-solid/);

  const light = source("app/globals.css");
  assert.match(light, /--color-warning-solid-foreground: var\(--warning-solid-foreground\)/);
  // Light theme warning is dark amber -> white text; dark/black are bright -> near-black.
  assert.match(light, /--warning: #b45309;[\s\S]{0,200}--warning-solid-foreground: #ffffff;/);
  assert.match(light, /--warning: #fbbf24;[\s\S]{0,200}--warning-solid-foreground: #1f1400;/);
  assert.match(source("app/black-theme.css"), /--warning-solid-foreground: #1f1400;/);
});
