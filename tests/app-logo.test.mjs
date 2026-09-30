import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");
const binary = (relative) => readFileSync(path.join(root, relative));

const LOGO_CONSUMERS = [
  "components/layouts/AppShell.tsx",
  "components/layouts/MobileHeader.tsx",
  "features/auth/components/AuthPage.tsx",
];

test("the brand mark is the app logo in every chrome surface", () => {
  const markPath = path.join(root, "public/images/logo/meydan-mark.svg");
  assert.ok(existsSync(markPath), "the mark must live at public/images/logo/meydan-mark.svg");

  const mark = source("public/images/logo/meydan-mark.svg");
  assert.match(mark, /^<svg[^>]*viewBox="0 0 531 536"/, "the mark keeps its original viewBox");
  assert.match(mark, /fill="white"/, "the mark is the white emblem artwork");

  const logo = source("components/shared/AppLogo.tsx");
  assert.match(logo, /src="\/images\/logo\/meydan-mark\.svg"/);
  assert.match(logo, /bg-brand/, "the white mark must sit on a brand tile");
  assert.match(logo, /alt=""/, "the mark is decorative: the name sits next to it");

  for (const file of LOGO_CONSUMERS) {
    assert.match(source(file), /import \{ AppLogo \} from "@\/components\/shared\/AppLogo"/, `${file} imports the logo`);
    assert.match(source(file), /<AppLogo/, `${file} renders the logo`);
    assert.doesNotMatch(source(file), />م</, `${file} must not keep the old letter tile`);
  }
});

test("browser, iOS and app icons all come from the same mark", () => {
  const ico = binary("app/favicon.ico");
  // ICONDIR: reserved 0, type 1 (icon), then the image count.
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.ok(ico.readUInt16LE(4) >= 3, "favicon must bundle several sizes");

  const iconSvg = source("app/icon.svg");
  assert.match(iconSvg, /viewBox="0 0 512 512"/);
  assert.match(iconSvg, /fill="#dc2626"/, "the icon carries the brand tile");
  assert.match(iconSvg, /fill="white"/, "the icon carries the white mark");
  assert.match(iconSvg, /scale\(0\.67/, "the mark is padded inside the tile");

  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const file of ["app/apple-icon.png"]) {
    assert.deepEqual([...binary(file).subarray(0, 8)], pngMagic, `${file} must be a PNG`);
  }
});
