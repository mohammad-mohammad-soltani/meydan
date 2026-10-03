import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("the desktop sidebar carries the signed-in compose action", () => {
  const buttonPath = path.join(root, "components/layouts/SidebarComposeButton.tsx");
  assert.ok(existsSync(buttonPath), "SidebarComposeButton must exist");

  const button = source("components/layouts/SidebarComposeButton.tsx");
  assert.match(button, /href="\/compose"/);
  assert.match(button, /نوشتن/);
  assert.match(button, /rounded-pill/);
  assert.match(button, /bg-brand/);
  // Icon-only affordances need a name; here the pill also shows visible text.
  assert.match(button, /PenLine/);

  const shell = source("components/layouts/AppShell.tsx");
  assert.match(shell, /import \{ SidebarComposeButton \} from "\.\/SidebarComposeButton"/);
  assert.match(shell, /\{isAuthenticated \? <SidebarComposeButton \/> : null\}/);

  const nav = shell.indexOf('aria-label="ناوبری دسکتاپ"');
  const pill = shell.indexOf("<SidebarComposeButton />");
  const asideEnd = shell.indexOf("</aside>");
  assert.ok(nav >= 0, "desktop nav must exist");
  assert.ok(pill > nav && pill < asideEnd, "the compose pill must live in the desktop sidebar, after the nav");
});

test("the floating compose button yields the desktop breakpoint to the sidebar", () => {
  const fab = source("components/layouts/FloatingComposeButton.tsx");
  assert.match(fab, /lg:hidden/);
  // No desktop-only sizing or offsets may linger once the button is mobile-only.
  assert.doesNotMatch(fab, /lg:(size|left|bottom)-/);
});
