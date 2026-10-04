import assert from "node:assert/strict";
import test from "node:test";
import {
  LIVE_MAP_THEME,
  makeProvinceStyle,
} from "../features/map/map-theme.ts";

test("live map uses the keyless OpenFreeMap dark vector style", () => {
  assert.equal(
    LIVE_MAP_THEME.styleUrl,
    "https://tiles.openfreemap.org/styles/dark",
  );
  assert.match(LIVE_MAP_THEME.mapLibreScriptUrl, /maplibre-gl@5\.14\.0/);
  assert.match(
    LIVE_MAP_THEME.leafletBridgeScriptUrl,
    /maplibre-gl-leaflet@0\.1\.3/,
  );
  assert.doesNotMatch(JSON.stringify(LIVE_MAP_THEME), /carto|api[_-]?key/i);
  assert.equal(LIVE_MAP_THEME.background, "#1c1c1c");
  assert.equal(LIVE_MAP_THEME.provinceStroke, "#9a9aa3");
  assert.equal(LIVE_MAP_THEME.provinceFill, "#242424");
  assert.equal(
    LIVE_MAP_THEME.provincesGeoJsonUrl,
    "/maps/iran-provinces.geojson",
  );
  assert.deepEqual(makeProvinceStyle(), {
    color: "#9a9aa3",
    weight: 1.35,
    opacity: 0.95,
    fillColor: "#242424",
    fillOpacity: 0.34,
  });
});
