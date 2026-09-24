import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateByRegion,
  pointInGeometry,
  provinceForPoint,
} from "../features/map/geo/aggregation.ts";

const tehran = {
  type: "Feature",
  properties: { "name:fa": "تهران" },
  geometry: { type: "Polygon", coordinates: [[[50, 35], [52, 35], [52, 37], [50, 37], [50, 35]]] },
};
const khuzestan = {
  type: "Feature",
  properties: { "name:fa": "خوزستان" },
  geometry: { type: "MultiPolygon", coordinates: [[[[47, 30], [49, 30], [49, 32], [47, 32], [47, 30]]]] },
};

test("point-in-polygon includes its border and excludes points outside it", () => {
  assert.equal(pointInGeometry([51, 36], tehran.geometry), true);
  assert.equal(pointInGeometry([50, 36], tehran.geometry), true);
  assert.equal(pointInGeometry([53, 36], tehran.geometry), false);
});

test("province lookup supports MultiPolygon boundaries", () => {
  const boundaries = { type: "FeatureCollection", features: [tehran, khuzestan] };
  assert.equal(provinceForPoint({ latitude: 31, longitude: 48 }, boundaries)?.name, "خوزستان");
  assert.equal(provinceForPoint({ latitude: 28, longitude: 60 }, boundaries), null);
});

test("country aggregation counts an inconsistent record in its coordinate province exactly once", () => {
  const boundaries = { type: "FeatureCollection", features: [tehran, khuzestan] };
  const squares = [
    { id: "1", name: "تهران", latitude: 35.7, longitude: 51.4, provinceId: 9, provinceName: "خراسان رضوی", cityId: 8, cityName: "فریمان" },
    { id: "2", name: "اهواز", latitude: 31.3, longitude: 48.7, provinceId: 13, provinceName: "خوزستان", cityId: 9, cityName: "اهواز" },
  ];

  const aggregates = aggregateByRegion(squares, boundaries, "province");
  assert.deepEqual(aggregates.map((item) => [item.name, item.count]).sort(), [["تهران", 1], ["خوزستان", 1]]);
  assert.equal(aggregates.reduce((sum, item) => sum + item.count, 0), 2);
});
