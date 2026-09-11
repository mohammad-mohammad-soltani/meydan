import assert from "node:assert/strict";
import test from "node:test";
import {
  LIVE_MAP_THEME,
  makePinHtml,
  makeProvinceStyle,
} from "../features/map/map-theme.ts";

test("live map theme matches the dark red reference treatment", () => {
  assert.match(LIVE_MAP_THEME.tileUrl, /dark_nolabels/);
  assert.equal(LIVE_MAP_THEME.background, "#171a1b");
  assert.equal(LIVE_MAP_THEME.provinceStroke, "#e5483f");
  assert.equal(LIVE_MAP_THEME.provinceFill, "#272a2b");
  assert.deepEqual(makeProvinceStyle(), {
    color: "#e5483f",
    weight: 1.35,
    opacity: 0.95,
    fillColor: "#272a2b",
    fillOpacity: 0.34,
  });
});

test("aggregate marker is a red teardrop pin with its count inside", () => {
  const html = makePinHtml("۱۲");
  assert.match(html, /map-live-pin/);
  assert.match(html, /۱۲/);
  assert.match(html, /#e5544b/);
  assert.match(html, /rotate\(45deg\)/);
});
