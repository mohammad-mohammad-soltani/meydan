import { test, expect } from "@playwright/test";

const points = [
  ["center", 35.7, 51.4, 1],
  ["north", 35.8, 51.4, 1],
  ["south", 35.6, 51.4, 1],
  ["east", 35.7, 51.55, 1],
  ["west", 35.7, 51.25, 1],
  ["neighbor", 35.7, 51.56, 2],
];

async function openMap(page, url = "/map", delay = 0) {
  // Keep the actual Leaflet camera, DOM, styles and local province geometry.
  // Only the remote data/tiles are fixtures, so the regressions are repeatable.
  await page.route("https://unpkg.com/**", (route) => route.abort());
  await page.route("https://*.tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.route("**/api/meydan/squares/map*", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({
      json: {
        data: {
          features: points.map(([id, lat, lng, city]) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {
              id,
              name: `میدان ${id}`,
              province_id: 8,
              province_name: "تهران",
              city_id: city,
              city_name: city === 1 ? "تهران" : "شهر همسایه",
            },
          })),
        },
      },
    });
  });
  // Capture the real camera through a public Leaflet method, without adding
  // test hooks or a global map reference to production code.
  await page.addInitScript(() => {
    let leaflet;
    Object.defineProperty(window, "L", {
      configurable: true,
      get: () => leaflet,
      set(value) {
        leaflet = value;
        const original = value.Map.prototype.getCenter;
        value.Map.prototype.getCenter = function (...args) {
          window.testMap = this;
          return original.apply(this, args);
        };
      },
    });
  });
  await page.goto(url);
  await expect(page.locator(".leaflet-marker-icon").first()).toBeAttached();
  await page.waitForFunction(() => window.testMap);
}

async function move(page, latitude, longitude, zoom) {
  await page.evaluate(
    ({ latitude, longitude, zoom }) => {
      window.testMap
        .stop()
        .setView([latitude, longitude], zoom, { animate: false });
    },
    { latitude, longitude, zoom },
  );
}

const square = (page, id) =>
  page.locator(`.leaflet-marker-icon[data-marker-id="${id}"]`);

async function expectPopupAligned(page, id) {
  await expect(page.locator(".map-square-popup")).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate((id) => {
        const marker = document
          .querySelector(`.leaflet-marker-icon[data-marker-id="${id}"]`)
          .getBoundingClientRect();
        const tip = document
          .querySelector(".map-square-popup .leaflet-popup-tip-container")
          .getBoundingClientRect();
        return Math.abs(marker.x + marker.width / 2 - (tip.x + tip.width / 2));
      }, id),
    )
    .toBeLessThan(3);
}

test("hover stays silent and click opens the square popup", async ({
  page,
}) => {
  await openMap(page);
  await move(page, 35.7, 51.4, 15);
  const marker = square(page, "center");
  await marker.hover();
  await expect(page.locator(".leaflet-tooltip")).toHaveCount(0);
  await marker.click();
  await expect(page.locator(".map-square-popup")).toBeVisible();
});

test("all four city edges and a neighboring city retain their individual squares", async ({
  page,
}) => {
  await openMap(page);
  for (const [id, latitude, longitude] of points.slice(1)) {
    await move(page, latitude, longitude, 15);
    await expect(square(page, id)).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(6);
    await expect(page.locator(".map-live-pin")).toHaveCount(0);
  }
  await expect(square(page, "east")).toBeVisible();
  await expect(square(page, "neighbor")).toBeVisible();
});

test("popup stays attached and open across pan, zoom and responsive resize", async ({
  page,
}) => {
  await openMap(page);
  await move(page, 35.7, 51.4, 15);
  await square(page, "center").click();
  await expectPopupAligned(page, "center");
  await expect(page.locator(".map-square-card-link")).toHaveAttribute(
    "href",
    "/square/center",
  );
  await move(page, 35.701, 51.401, 16);
  await expectPopupAligned(page, "center");
  await page.setViewportSize({ width: 390, height: 844 });
  await expectPopupAligned(page, "center");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.testMap.getSize().x ===
          document.querySelector(".leaflet-container").clientWidth,
      ),
    )
    .toBe(true);
  await page.locator(".leaflet-popup-close-button").click();
  await expect(page.locator(".map-square-popup")).toHaveCount(0);
});

test("a deep link resolves even when the map data arrives after the camera movement", async ({
  page,
}) => {
  await openMap(page, "/map?lat=35.8&lng=51.4", 1500);
  await expect(square(page, "north")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(6);
});

test("search finds a square at any map level and focuses it", async ({
  page,
}) => {
  await openMap(page);
  await move(page, 35.7, 51.4, 15);
  const search = page.getByRole("textbox", {
    name: "جست‌وجوی استان، شهر یا میدان روی نقشه",
  });
  await search.fill("میدان west");
  await page
    .getByRole("button", { name: "میدان west میدان", exact: true })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(() => Math.abs(window.testMap.getCenter().lng - 51.25)),
    )
    .toBeLessThan(0.001);
  await expect(square(page, "west")).toBeVisible();
});

test("geolocation denial produces a readable message and allows retry", async ({
  page,
}) => {
  await openMap(page);
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) =>
      error({ code: 1 });
  });
  const locate = page.getByRole("button", { name: "تمرکز روی موقعیت من" });
  await locate.click();
  await expect(page.getByRole("status")).toContainText("اجازهٔ دسترسی");
  await expect(locate).toBeEnabled();
});

test("refresh updates marker data without resetting the camera", async ({
  page,
}) => {
  await openMap(page);
  await move(page, 35.7, 51.4, 15);
  await page.route("**/api/meydan/squares/map*", (route) =>
    route.fulfill({
      json: {
        data: {
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [51.4, 35.7] },
              properties: {
                id: "fresh",
                name: "میدان تازه",
                province_id: 8,
                province_name: "تهران",
                city_id: 1,
                city_name: "تهران",
              },
            },
          ],
        },
      },
    }),
  );
  await page.getByRole("button", { name: "به‌روزرسانی میدان‌ها" }).click();
  await expect(
    page.locator('.leaflet-marker-icon[data-marker-id="fresh"]'),
  ).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  expect(await page.evaluate(() => window.testMap.getZoom())).toBe(15);
});

test("missing province boundaries do not hide available square data", async ({
  page,
}) => {
  await page.route("**/maps/iran-provinces.geojson", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await openMap(page, "/map?lat=35.7&lng=51.4");
  await expect(square(page, "center")).toBeVisible();
  await expect(
    page.getByText(
      "مرزهای استان‌ها دریافت نشد؛ میدان‌ها همچنان نمایش داده می‌شوند.",
    ),
  ).toBeVisible();
});

test("country reset returns from street detail to province aggregates", async ({
  page,
}) => {
  await openMap(page);
  await move(page, 35.7, 51.4, 15);
  await page
    .getByRole("button", { name: "نمایش کل ایران", exact: true })
    .click();
  await expect(page.locator(".map-live-pin")).toHaveCount(1);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  expect(await page.evaluate(() => window.testMap.getZoom())).toBe(5);
});
