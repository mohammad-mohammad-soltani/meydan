import assert from "node:assert/strict";
import test from "node:test";
import {
  LIVE_MAP_THEME,
  makePinHtml,
  makeProvinceStyle,
} from "../features/map/map-theme.ts";

test("live map uses the keyless OpenFreeMap dark vector style", () => {
  assert.equal(LIVE_MAP_THEME.styleUrl, "https://tiles.openfreemap.org/styles/dark");
  assert.match(LIVE_MAP_THEME.mapLibreScriptUrl, /maplibre-gl@5\.14\.0/);
  assert.match(LIVE_MAP_THEME.leafletBridgeScriptUrl, /maplibre-gl-leaflet@0\.1\.3/);
  assert.doesNotMatch(JSON.stringify(LIVE_MAP_THEME), /carto|api[_-]?key/i);
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

test("aggregate marker is a circular red counter", () => {
  const html = makePinHtml("۱۲");
  assert.match(html, /map-live-pin/);
  assert.match(html, /۱۲/);
  assert.match(html, /#e5544b/);
  assert.match(html, /border-radius:50%/);
  assert.doesNotMatch(html, /rotate\(45deg\)/);
});
