import assert from "node:assert/strict";
import test from "node:test";
import {
  getViewportLevel,
  nearestVisibleSquare,
} from "../features/map/geo/viewport.ts";

const squares = [
  { id: "center", latitude: 35.7, longitude: 51.4 },
  { id: "north", latitude: 35.8, longitude: 51.4 },
  { id: "south", latitude: 35.6, longitude: 51.4 },
  { id: "east", latitude: 35.7, longitude: 51.55 },
  { id: "west", latitude: 35.7, longitude: 51.25 },
];
for (const square of squares.slice(1)) {
  test(`zooming into the ${square.id} edge keeps detail level and finds the actual visible square`, () => {
    const viewport = {
      ...square,
      zoom: 15,
      bounds: {
        south: square.latitude - 0.01,
        north: square.latitude + 0.01,
        west: square.longitude - 0.01,
        east: square.longitude + 0.01,
      },
    };
    assert.equal(getViewportLevel(viewport.zoom), "city");
    assert.equal(nearestVisibleSquare(squares, viewport)?.id, square.id);
  });
}
test("selection uses the closest visible point, not input order or an offscreen city center", () => {
  const viewport = {
    latitude: 35.7,
    longitude: 51.54,
    zoom: 12,
    bounds: { south: 35.5, north: 35.9, west: 51.2, east: 51.6 },
  };
  assert.equal(nearestVisibleSquare(squares, viewport)?.id, "east");
  assert.equal(
    nearestVisibleSquare([...squares].reverse(), viewport)?.id,
    "east",
  );
});
test("an empty viewport does not fall back to province markers at street zoom", () => {
  assert.equal(
    nearestVisibleSquare(squares, {
      latitude: 0,
      longitude: 0,
      zoom: 18,
      bounds: { south: -1, north: 1, west: -1, east: 1 },
    }),
    null,
  );
  assert.equal(getViewportLevel(18), "city");
  assert.equal(getViewportLevel(5), "country");
  assert.equal(getViewportLevel(8), "province");
});
