import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("compose lives on the floating button on every breakpoint, as in the reference design", () => {
  assert.ok(!existsSync(path.join(root, "components/layouts/SidebarComposeButton.tsx")), "the sidebar compose pill was replaced by the floating button");
  const shell = source("components/layouts/AppShell.tsx");
  assert.doesNotMatch(shell, /SidebarComposeButton/);
  assert.match(shell, /<FloatingComposeButton \/>/);

  const fab = source("components/layouts/FloatingComposeButton.tsx");
  assert.match(fab, /href="\/compose"/);
  assert.match(fab, /aria-label="نوشتن روایت تازه"/);
  assert.match(fab, /bg-brand/);
  // Pinned to the viewport's bottom-left corner on desktop.
  assert.match(fab, /lg:fixed/);
  assert.doesNotMatch(fab, /lg:hidden/);
});
